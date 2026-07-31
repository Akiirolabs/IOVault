import express from "express";
import { toFile } from "openai";
import { requireAuth, requireCsrf } from "./auth.js";
import {
  addMessage, countTodayRuns, createConversation, createTaskRun, decideApproval,
  ensureAgentProfile, finishRun, getAgentProfile, getConversation, listApprovals,
  listConnectors, listConversations, listDomainRecords, listRunEvents, listTasks,
  markApprovalExecuted, migrateLegacyAgent, pendingApprovalCount, resetApproval, updateAgentProfile,
  cancelRun,
} from "./agent-db.js";
import {
  completeGoogleConnection, disconnectGoogle, executeGoogleAction, googleAuthorizationUrl,
  googleConfigured, readGoogleState,
} from "./google-connector.js";

const router=express.Router();
const agents=new Set(["learning","career"]);
const validAgent=(request,response,next)=>{ if(!agents.has(request.params.agent)){response.status(404).json({error:"Unknown agent."});return;} next(); };
const boundedText=(value,max=8000)=>typeof value==="string"&&value.trim()&&value.length<=max;

router.get("/agents/:agent",requireAuth,validAgent,(request,response)=>{
  const profile=ensureAgentProfile(request.userId,request.params.agent);
  response.json({agent:request.params.agent,profile:profile.profile,policy:profile.policy,connected:listConnectors(request.userId),tasks:listTasks(request.userId,request.params.agent),approvals:listApprovals(request.userId,request.params.agent),records:listDomainRecords(request.userId,request.params.agent)});
});
router.post("/agents/:agent/migrate",requireAuth,requireCsrf,validAgent,(request,response)=>{
  if(!request.body?.legacy||typeof request.body.legacy!=="object"){response.status(400).json({error:"Legacy data must be an object."});return;}
  response.json({migrated:migrateLegacyAgent(request.userId,request.params.agent,request.body.legacy)});
});
router.get("/agents/:agent/conversations",requireAuth,validAgent,(request,response)=>response.json({conversations:listConversations(request.userId,request.params.agent)}));
router.post("/agents/:agent/conversations",requireAuth,requireCsrf,validAgent,(request,response)=>response.status(201).json({conversation:createConversation(request.userId,request.params.agent,request.body?.title)}));
router.get("/agents/:agent/conversations/:id",requireAuth,validAgent,(request,response)=>{const value=getConversation(request.userId,request.params.id); if(!value||value.agent!==request.params.agent){response.status(404).json({error:"Conversation not found."});return;} response.json({conversation:value});});
router.post("/agents/:agent/messages",requireAuth,requireCsrf,validAgent,(request,response)=>{
  const message=request.body?.message, conversationId=String(request.body?.conversationId||"");
  if(!boundedText(message)){response.status(message?.length>8000?413:400).json({error:"Message must contain 1–8,000 characters."});return;}
  const configuredLimit=Math.max(1,Math.min(100,Number(ensureAgentProfile(request.userId,request.params.agent).policy?.dailyRunLimit)||25));
  if(countTodayRuns(request.userId,request.params.agent)>=configuredLimit){response.setHeader("Retry-After","3600");response.status(429).json({error:"Daily agent limit reached."});return;}
  const conversation=getConversation(request.userId,conversationId);
  if(!conversation||conversation.agent!==request.params.agent){response.status(404).json({error:"Conversation not found."});return;}
  addMessage(request.userId,conversationId,"user",message.trim());
  const created=createTaskRun(request.userId,request.params.agent,conversationId,message.trim().slice(0,100),{message:message.trim(),conversationId});
  response.status(202).json(created);
});
router.get("/agents/:agent/events",requireAuth,validAgent,(request,response)=>{
  response.setHeader("Content-Type","text/event-stream"); response.setHeader("Cache-Control","no-cache"); response.setHeader("Connection","keep-alive");
  let cursor=Math.max(0,Number(request.query.after||0)||0,Number(request.headers["last-event-id"]||0)||0),closed=false;
  const flush=()=>{for(const event of listRunEvents(request.userId,cursor,request.params.agent)){cursor=event.id;response.write(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);}};
  flush(); const timer=setInterval(()=>{if(!closed){flush();response.write(": keepalive\n\n");}},2500);
  request.on("close",()=>{closed=true;clearInterval(timer);});
});
router.get("/agents/:agent/tasks",requireAuth,validAgent,(request,response)=>response.json({tasks:listTasks(request.userId,request.params.agent)}));
router.post("/agent-runs/:id/cancel",requireAuth,requireCsrf,(request,response)=>{const cancelled=cancelRun(request.userId,request.params.id);response.status(cancelled?200:409).json(cancelled?{cancelled:true}:{error:"Run cannot be cancelled."});});
router.get("/approvals",requireAuth,(request,response)=>response.json({approvals:listApprovals(request.userId,agents.has(request.query.agent)?request.query.agent:null)}));
router.post("/approvals/:id/reject",requireAuth,requireCsrf,(request,response)=>{const approval=decideApproval(request.userId,request.params.id,"rejected");if(!approval){response.status(409).json({error:"Approval is unavailable."});return;}if(!pendingApprovalCount(request.userId,approval.run_id))finishRun(approval.run_id,request.userId,"completed",{approvalResult:"rejected"});response.json({approval:{id:approval.id,status:"rejected"}});});
router.post("/approvals/:id/approve",requireAuth,requireCsrf,async(request,response)=>{
  const approval=decideApproval(request.userId,request.params.id,"approved"); if(!approval){response.status(409).json({error:"Approval is unavailable."});return;}
  try { const result=await executeGoogleAction(request.userId,approval.id,approval.action);markApprovalExecuted(request.userId,approval.id);if(!pendingApprovalCount(request.userId,approval.run_id))finishRun(approval.run_id,request.userId,"completed",{approvalResult:"executed",result});response.json({approval:{id:approval.id,status:"executed"},result}); }
  catch(error){const code=String(error.message||"connector_action_failed");if(code!=="google_action_requires_reconciliation")resetApproval(request.userId,approval.id);finishRun(approval.run_id,request.userId,"failed",{},code);response.status(502).json({error:code==="google_action_requires_reconciliation"?"This action has an uncertain provider result and must be reconciled before retrying.":"The approved Google action could not be completed. Reconnect Google and approve the same reviewed action again."});}
});
router.get("/agents/:agent/policy",requireAuth,validAgent,(request,response)=>response.json({policy:ensureAgentProfile(request.userId,request.params.agent).policy}));
router.patch("/agents/:agent/policy",requireAuth,requireCsrf,validAgent,(request,response)=>{const current=ensureAgentProfile(request.userId,request.params.agent);const policy={...current.policy,...request.body?.policy};const profile=updateAgentProfile(request.userId,request.params.agent,current.profile,policy);response.json({policy:profile.policy});});
router.get("/connectors",requireAuth,(request,response)=>response.json({connectors:listConnectors(request.userId),googleConfigured:googleConfigured()}));
router.post("/connectors/google/start",requireAuth,requireCsrf,(request,response)=>{const authorizationUrl=googleAuthorizationUrl(request.userId);if(!authorizationUrl){response.status(503).json({error:"Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first."});return;}response.json({authorizationUrl});});
router.get("/connectors/google/callback",async(request,response)=>{const userId=readGoogleState(request.query.state),appOrigin=process.env.APP_ORIGIN||"http://localhost:5173";if(!userId||!request.query.code){response.redirect(`${appOrigin}/?google=error`);return;}try{await completeGoogleConnection(userId,String(request.query.code));response.redirect(`${appOrigin}/?google=connected`);}catch{response.redirect(`${appOrigin}/?google=error`);}});
router.delete("/connectors/google",requireAuth,requireCsrf,async(request,response)=>{await disconnectGoogle(request.userId);response.json({disconnected:true});});
router.post("/voice/transcribe",requireAuth,requireCsrf,async(request,response)=>{
  const audio=String(request.body?.audioBase64||""); if(!audio||audio.length>1_800_000){response.status(audio?413:400).json({error:"Provide a short audio recording under 1.3 MB."});return;}
  const client=request.app.locals.agentClient; if(!client){response.status(503).json({error:"AI voice is not configured."});return;}
  try{const file=await toFile(Buffer.from(audio,"base64"),"voice.webm",{type:String(request.body?.mimeType||"audio/webm")});const result=await client.audio.transcriptions.create({model:process.env.OPENAI_TRANSCRIBE_MODEL||"gpt-4o-mini-transcribe",file});response.json({transcript:result.text});}catch{response.status(502).json({error:"The recording could not be transcribed."});}
});
router.post("/voice/speak",requireAuth,requireCsrf,async(request,response)=>{
  const text=String(request.body?.text||"");if(!boundedText(text,4000)){response.status(400).json({error:"Speech text must contain 1–4,000 characters."});return;}const client=request.app.locals.agentClient;if(!client){response.status(503).json({error:"AI voice is not configured."});return;}
  try{const audio=await client.audio.speech.create({model:process.env.OPENAI_SPEECH_MODEL||"gpt-4o-mini-tts",voice:"coral",input:text});response.json({audioBase64:Buffer.from(await audio.arrayBuffer()).toString("base64"),mimeType:"audio/mpeg"});}catch{response.status(502).json({error:"Speech could not be generated."});}
});

export default router;
