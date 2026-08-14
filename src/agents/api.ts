import { apiFetch } from "../api";
import type { AgentKind, AgentSnapshot } from "./types";

async function data<T>(response:Response):Promise<T>{const value=await response.json();if(!response.ok)throw new Error(value.error||"Agent request failed.");return value as T;}
export const agentApi={
  snapshot:(agent:AgentKind)=>apiFetch(`/api/agents/${agent}`).then((r)=>data<AgentSnapshot>(r)),
  migrate:(agent:AgentKind,legacy:unknown)=>apiFetch(`/api/agents/${agent}/migrate`,{method:"POST",body:JSON.stringify({legacy})}).then((r)=>data<{migrated:boolean}>(r)),
  conversations:(agent:AgentKind)=>apiFetch(`/api/agents/${agent}/conversations`).then((r)=>data<{conversations:Array<{id:string;title:string}>}>(r)),
  conversation:(agent:AgentKind,id:string)=>apiFetch(`/api/agents/${agent}/conversations/${id}`).then((r)=>data<{conversation:{id:string;title:string;messages:Array<{id:string;role:"user"|"assistant";content:string}>}}>(r)),
  createConversation:(agent:AgentKind)=>apiFetch(`/api/agents/${agent}/conversations`,{method:"POST",body:"{}"}).then((r)=>data<{conversation:{id:string;title:string}}>(r)),
  message:(agent:AgentKind,conversationId:string,message:string)=>apiFetch(`/api/agents/${agent}/messages`,{method:"POST",body:JSON.stringify({conversationId,message})}).then((r)=>data<{taskId:string;runId:string}>(r)),
  cancel:(runId:string)=>apiFetch(`/api/agent-runs/${runId}/cancel`,{method:"POST",body:"{}"}).then((r)=>data(r)),
  decide:(id:string,decision:"approve"|"reject")=>apiFetch(`/api/approvals/${id}/${decision}`,{method:"POST",body:"{}"}).then((r)=>data(r)),
  connectGoogle:()=>apiFetch("/api/connectors/google/start",{method:"POST",body:"{}"}).then((r)=>data<{authorizationUrl:string}>(r)),
  disconnectGoogle:()=>apiFetch("/api/connectors/google",{method:"DELETE",body:"{}"}).then((r)=>data(r)),
  updatePolicy:(agent:AgentKind,policy:Record<string,unknown>)=>apiFetch(`/api/agents/${agent}/policy`,{method:"PATCH",body:JSON.stringify({policy})}).then((r)=>data(r)),
  realtimeSecret:(agent:AgentKind,signal?:AbortSignal)=>apiFetch(`/api/agents/${agent}/realtime/session`,{method:"POST",body:"{}",signal}).then((r)=>data<{value:string;expiresAt?:number;model:string}>(r)),
  saveRealtimeTranscript:(agent:AgentKind,conversationId:string,content:string,turnId:string)=>apiFetch(`/api/agents/${agent}/realtime/transcripts`,{method:"POST",body:JSON.stringify({conversationId,role:"user",content,turnId})}).then((r)=>data(r)),
  transcribe:(audioBase64:string,mimeType:string)=>apiFetch("/api/voice/transcribe",{method:"POST",body:JSON.stringify({audioBase64,mimeType})}).then((r)=>data<{transcript:string}>(r)),
  speak:(text:string)=>apiFetch("/api/voice/speak",{method:"POST",body:JSON.stringify({text})}).then((r)=>data<{audioBase64:string;mimeType:string}>(r)),
};
