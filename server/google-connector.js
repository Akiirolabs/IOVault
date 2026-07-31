import crypto from "node:crypto";
import { beginConnectorAction, deleteConnector, finishConnectorAction, getConnector, saveConnector } from "./agent-db.js";

const scopes = [
  "openid", "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

function secret() {
  const value = process.env.CONNECTOR_ENCRYPTION_KEY || (process.env.NODE_ENV === "production" ? "" : "iovault-local-connector-key");
  if (!value) throw new Error("CONNECTOR_ENCRYPTION_KEY is required.");
  return crypto.createHash("sha256").update(value).digest();
}
function encrypt(value) {
  const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv("aes-256-gcm",secret(),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".");
}
function decrypt(value) {
  const [iv,tag,data]=String(value).split(".");
  const decipher=crypto.createDecipheriv("aes-256-gcm",secret(),Buffer.from(iv,"base64url"));
  decipher.setAuthTag(Buffer.from(tag,"base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8"));
}
function stateSignature(payload) { return crypto.createHmac("sha256",secret()).update(payload).digest("base64url"); }
export function googleConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET); }
export function createGoogleState(userId) {
  const payload=Buffer.from(JSON.stringify({userId,expires:Date.now()+10*60_000,nonce:crypto.randomUUID()})).toString("base64url");
  return `${payload}.${stateSignature(payload)}`;
}
export function readGoogleState(state) {
  const [payload,signature]=String(state).split(".");
  if (!payload || !signature || signature.length!==stateSignature(payload).length || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(stateSignature(payload)))) return null;
  try { const parsed=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")); return parsed.expires>Date.now()?parsed.userId:null; } catch { return null; }
}
export function googleAuthorizationUrl(userId) {
  if (!googleConfigured()) return null;
  const query=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:process.env.GOOGLE_REDIRECT_URI||"http://localhost:8787/api/connectors/google/callback",response_type:"code",access_type:"offline",prompt:"consent",scope:scopes.join(" "),state:createGoogleState(userId),include_granted_scopes:"true"});
  return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
}
async function tokenRequest(params) {
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(params)});
  if (!response.ok) throw new Error("google_token_exchange_failed");
  return response.json();
}
export async function completeGoogleConnection(userId, code) {
  const tokens=await tokenRequest({code,client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,redirect_uri:process.env.GOOGLE_REDIRECT_URI||"http://localhost:8787/api/connectors/google/callback",grant_type:"authorization_code"});
  const profileResponse=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{Authorization:`Bearer ${tokens.access_token}`}});
  const profile=profileResponse.ok?await profileResponse.json():{};
  const expiresAt=tokens.expires_in?new Date(Date.now()+tokens.expires_in*1000).toISOString():null;
  saveConnector(userId,"google",profile.email||"Google",scopes,encrypt(tokens),expiresAt);
}
async function accessToken(userId) {
  const row=getConnector(userId,"google");
  if (!row) throw new Error("google_not_connected");
  const tokens=decrypt(row.encrypted_tokens);
  if (tokens.access_token && (!row.expires_at || Date.parse(row.expires_at)>Date.now()+60_000)) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error("google_reauthorization_required");
  const refreshed=await tokenRequest({refresh_token:tokens.refresh_token,client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,grant_type:"refresh_token"});
  const merged={...tokens,...refreshed,refresh_token:tokens.refresh_token};
  saveConnector(userId,"google",row.account_label,JSON.parse(row.scopes_json),encrypt(merged),new Date(Date.now()+refreshed.expires_in*1000).toISOString());
  return merged.access_token;
}
export async function executeGoogleAction(userId, approvalId, action) {
  const idempotencyKey=`${approvalId}:${action.type}`;
  const token=await accessToken(userId);
  const reservation=beginConnectorAction(userId,approvalId,"google",action.type,idempotencyKey);
  if(reservation.state==="success")return{provider:"google",reference:reservation.providerRef,replayed:true};
  if(reservation.state==="ambiguous")throw new Error("google_action_requires_reconciliation");
  let url, body;
  if (action.type==="calendar.create_event") {
    url="https://www.googleapis.com/calendar/v3/calendars/primary/events";
    body={summary:action.title,description:action.description||"Created with IO Vault",start:{dateTime:action.start},end:{dateTime:action.end},reminders:{useDefault:true}};
  } else if (action.type==="gmail.create_draft") {
    url="https://gmail.googleapis.com/gmail/v1/users/me/drafts";
    const raw=[`To: ${action.to}`,`Subject: ${action.subject}`,"Content-Type: text/plain; charset=UTF-8","",action.body].join("\r\n");
    body={message:{raw:Buffer.from(raw).toString("base64url")}};
  } else throw new Error("unsupported_google_action");
  const response=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if (!response.ok) { finishConnectorAction(userId,idempotencyKey,"failed",null,`http_${response.status}`); throw new Error(response.status===401?"google_reauthorization_required":"google_action_failed"); }
  const result=await response.json();
  finishConnectorAction(userId,idempotencyKey,"success",result.id||null);
  return { provider:"google", reference:result.id||null, link:result.htmlLink||null };
}
export async function disconnectGoogle(userId) {
  const row=getConnector(userId,"google");
  if (row) { try { const token=decrypt(row.encrypted_tokens); if(token.refresh_token||token.access_token) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token.refresh_token||token.access_token)}`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"}}); } catch { /* Local deletion still revokes IO Vault access. */ } }
  return deleteConnector(userId,"google");
}
