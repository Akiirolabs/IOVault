import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { realtimeTranscripts, startRealtimeVoice } from "./realtime";

class DataChannelMock {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = vi.fn();
}

class PeerMock {
  static latest: PeerMock;
  channel = new DataChannelMock();
  connectionState = "connected";
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  addTrack = vi.fn();
  close = vi.fn();
  createDataChannel = vi.fn(() => this.channel);
  createOffer = vi.fn(async () => ({ type: "offer", sdp: "local-sdp" }));
  setLocalDescription = vi.fn(async () => undefined);
  setRemoteDescription = vi.fn(async () => undefined);
  constructor() { PeerMock.latest = this; }
}

describe("Realtime WebRTC voice", () => {
  const stopTrack = vi.fn();
  beforeEach(() => {
    stopTrack.mockClear();
    vi.stubGlobal("RTCPeerConnection", PeerMock);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] })) } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("remote-sdp", { status: 200 })));
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("extracts the assistant transcript from final audio and response events", () => {
    expect(realtimeTranscripts({type:"response.output_audio_transcript.done",transcript:"Direct transcript",event_id:"audio-1"})).toEqual([{role:"assistant",content:"Direct transcript",eventId:"audio-1"}]);
    expect(realtimeTranscripts({type:"response.done",event_id:"response-1",response:{output:[{content:[{type:"audio",transcript:"Fallback transcript"}]}]}})).toEqual([{role:"assistant",content:"Fallback transcript",eventId:"response-1:0"}]);
  });

  it("uses only the ephemeral key, emits final transcripts once, and cleans up", async () => {
    const onTranscript = vi.fn(), onEnded = vi.fn();
    const session = await startRealtimeVoice({ ephemeralKey: "ephemeral-secret", onTranscript, onEnded });
    expect(fetch).toHaveBeenCalledWith("https://api.openai.com/v1/realtime/calls", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer ephemeral-secret" }) }));
    const userEvent = { type: "conversation.item.input_audio_transcription.completed", transcript: "Hello", event_id: "turn-1" };
    PeerMock.latest.channel.onmessage?.({ data: JSON.stringify(userEvent) } as MessageEvent);
    PeerMock.latest.channel.onmessage?.({ data: JSON.stringify(userEvent) } as MessageEvent);
    PeerMock.latest.channel.onmessage?.({ data: JSON.stringify({ type: "response.output_audio_transcript.done", transcript: "Hi there", event_id: "turn-2" }) } as MessageEvent);
    expect(onTranscript).toHaveBeenCalledTimes(2);
    const lateMessage = PeerMock.latest.channel.onmessage;
    const lateTrack = PeerMock.latest.ontrack;
    session.stop();
    lateMessage?.({ data: JSON.stringify({ type: "conversation.item.input_audio_transcription.completed", transcript: "Too late", event_id: "turn-3" }) } as MessageEvent);
    const lateTrackStop=vi.fn();lateTrack?.({track:{stop:lateTrackStop},streams:[]} as unknown as RTCTrackEvent);
    expect(onTranscript).toHaveBeenCalledTimes(2);
    expect(lateTrackStop).toHaveBeenCalled();
    expect(PeerMock.latest.channel.close).toHaveBeenCalled();
    expect(PeerMock.latest.close).toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalled();
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("cleans up microphone and peer state when SDP negotiation fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rejected", { status: 401 })));
    await expect(startRealtimeVoice({ ephemeralKey: "expired", onTranscript: vi.fn() })).rejects.toThrow("Realtime voice connection was rejected.");
    expect(PeerMock.latest.close).toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalled();
  });

  it("stops a microphone acquired after cancellation during permission", async () => {
    let resolveMedia!: (stream: { getTracks: () => Array<{ stop: () => void }> }) => void;
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:vi.fn(()=>new Promise((resolve)=>{resolveMedia=resolve;}))}});
    const controller=new AbortController();
    const starting=startRealtimeVoice({ephemeralKey:"ephemeral",signal:controller.signal,onTranscript:vi.fn()});
    controller.abort();resolveMedia({getTracks:()=>[{stop:stopTrack}]});
    await expect(starting).rejects.toMatchObject({name:"AbortError"});
    expect(stopTrack).toHaveBeenCalled();expect(PeerMock.latest.close).toHaveBeenCalled();
  });

  it("aborts pending SDP and closes on provider errors", async () => {
    vi.stubGlobal("fetch",vi.fn((_url,_init)=>new Promise((_resolve,reject)=>{(_init as RequestInit).signal?.addEventListener("abort",()=>reject(new DOMException("Aborted","AbortError")));})));
    const controller=new AbortController(),starting=startRealtimeVoice({ephemeralKey:"ephemeral",signal:controller.signal,onTranscript:vi.fn()});
    await vi.waitFor(()=>expect(fetch).toHaveBeenCalled());controller.abort();await expect(starting).rejects.toMatchObject({name:"AbortError"});expect(stopTrack).toHaveBeenCalled();
    vi.stubGlobal("fetch",vi.fn(async()=>new Response("remote-sdp",{status:200})));
    const onError=vi.fn();await startRealtimeVoice({ephemeralKey:"ephemeral",onTranscript:vi.fn(),onError});
    const providerMessage=PeerMock.latest.channel.onmessage;providerMessage?.({data:JSON.stringify({type:"error",error:{message:"Provider stopped"}})} as MessageEvent);
    expect(onError).toHaveBeenCalledWith("Provider stopped");expect(PeerMock.latest.close).toHaveBeenCalled();expect(stopTrack).toHaveBeenCalled();
  });
});
