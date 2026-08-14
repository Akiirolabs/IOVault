export type RealtimeTranscript = { role: "user" | "assistant"; content: string; eventId?: string };

type StartOptions = {
  ephemeralKey: string;
  signal?: AbortSignal;
  onTranscript: (transcript: RealtimeTranscript) => void;
  onState?: (state: "connected" | "listening" | "speaking") => void;
  onError?: (message: string) => void;
  onEnded?: () => void;
};

export type RealtimeVoiceSession = { stop: () => void };

export function realtimeTranscripts(payload:Record<string,any>):RealtimeTranscript[]{
  const eventId=String(payload.event_id??payload.item_id??payload.response_id??"");
  if(payload.type==="conversation.item.input_audio_transcription.completed"){
    const content=String(payload.transcript??"").trim();
    return content?[{role:"user",content,eventId:eventId||undefined}]:[];
  }
  if(["response.audio_transcript.done","response.output_audio_transcript.done"].includes(payload.type)){
    const content=String(payload.transcript??"").trim();
    return content?[{role:"assistant",content,eventId:eventId||undefined}]:[];
  }
  if(payload.type==="response.done"){
    const transcripts=(payload.response?.output??[]).flatMap((item:any)=>(item?.content??[]).map((part:any)=>String(part?.transcript??part?.text??"").trim()).filter(Boolean));
    return transcripts.map((content:string,index:number)=>({role:"assistant" as const,content,eventId:eventId?`${eventId}:${index}`:undefined}));
  }
  return [];
}

export async function startRealtimeVoice({ ephemeralKey, signal, onTranscript, onState, onError, onEnded }: StartOptions): Promise<RealtimeVoiceSession> {
  if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") throw new Error("Continuous voice is not supported in this browser.");
  if (signal?.aborted) throw new DOMException("Voice start was cancelled.", "AbortError");
  const peer = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  let stopped = false;
  let stream: MediaStream | null = null;
  let maximumDuration = 0;
  const seen = new Set<string>();
  const channel = peer.createDataChannel("oai-events");
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (maximumDuration) window.clearTimeout(maximumDuration);
    signal?.removeEventListener("abort", stop);
    channel.onopen = null;channel.onmessage = null;peer.ontrack = null;peer.onconnectionstatechange = null;
    channel.close();
    peer.close();
    stream?.getTracks().forEach((track) => track.stop());
    audio.pause();
    audio.srcObject = null;
    onEnded?.();
  };
  signal?.addEventListener("abort", stop, { once: true });
  peer.ontrack = (event) => { if(stopped){event.track.stop();return;}audio.srcObject = event.streams[0] ?? new MediaStream([event.track]); void audio.play().catch(() => {if(!stopped)onError?.("Voice audio could not play. Check browser audio permissions.");}); };
  peer.onconnectionstatechange = () => {
    if (["failed", "disconnected", "closed"].includes(peer.connectionState) && !stopped) { onError?.("The voice connection ended unexpectedly."); stop(); }
  };
  channel.onopen = () => {if(!stopped)onState?.("connected");};
  channel.onmessage = (event) => {
    if(stopped)return;
    try {
      const payload = JSON.parse(String(event.data));
      if (payload.type === "input_audio_buffer.speech_started") onState?.("listening");
      if (payload.type === "response.audio.delta" || payload.type === "response.output_audio.delta") onState?.("speaking");
      for(const transcript of realtimeTranscripts(payload)){
        if(transcript.eventId&&seen.has(transcript.eventId))continue;
        if(transcript.eventId)seen.add(transcript.eventId);
        onTranscript(transcript);
      }
      if (payload.type === "error") { onError?.(String(payload.error?.message || "Realtime voice encountered an error.")); stop(); }
    } catch { onError?.("Realtime voice returned an unreadable event."); }
  };
  try {
    const acquiredStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream = acquiredStream;
    if(stopped||signal?.aborted){acquiredStream.getTracks().forEach((track)=>track.stop());throw new DOMException("Voice start was cancelled.","AbortError");}
    acquiredStream.getTracks().forEach((track) => peer.addTrack(track, acquiredStream));
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const response = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", body: offer.sdp, signal, headers: { Authorization: `Bearer ${ephemeralKey}`, "Content-Type": "application/sdp" } });
    if (!response.ok) throw new Error("Realtime voice connection was rejected.");
    await peer.setRemoteDescription({ type: "answer", sdp: await response.text() });
    if(stopped||signal?.aborted)throw new DOMException("Voice start was cancelled.","AbortError");
    maximumDuration = window.setTimeout(() => { onError?.("Voice conversations end after 10 minutes. Start a new session to continue."); stop(); }, 10 * 60_000);
    return { stop };
  } catch (error) {
    stop();
    throw error;
  }
}
