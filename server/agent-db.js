import crypto from "node:crypto";
import db from "./db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_profiles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent TEXT NOT NULL CHECK(agent IN ('learning','career')),
    profile_json TEXT NOT NULL DEFAULT '{}',
    policy_json TEXT NOT NULL DEFAULT '{}',
    migrated_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, agent)
  );
  CREATE TABLE IF NOT EXISTS agent_conversations (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_messages (
    id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL,
    content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_tasks (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent TEXT NOT NULL, conversation_id TEXT REFERENCES agent_conversations(id) ON DELETE SET NULL,
    title TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, agent TEXT NOT NULL,
    state TEXT NOT NULL, input_json TEXT NOT NULL, output_json TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0, available_at TEXT NOT NULL DEFAULT (datetime('now')),
    lease_until TEXT, error_code TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_run_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_type TEXT NOT NULL,
    data_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_approvals (
    id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, agent TEXT NOT NULL,
    action_type TEXT NOT NULL, action_json TEXT NOT NULL, summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', decided_at TEXT, executed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS connector_accounts (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, account_label TEXT, scopes_json TEXT NOT NULL DEFAULT '[]',
    encrypted_tokens TEXT NOT NULL, expires_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, provider)
  );
  CREATE TABLE IF NOT EXISTS connector_actions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approval_id TEXT REFERENCES agent_approvals(id) ON DELETE SET NULL, provider TEXT NOT NULL,
    action_type TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE, outcome TEXT NOT NULL,
    provider_ref TEXT, error_code TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agent_domain_records (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent TEXT NOT NULL, record_type TEXT NOT NULL, title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', data_json TEXT NOT NULL DEFAULT '{}',
    source_url TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_agent_runs_queue ON agent_runs(state, available_at);
  CREATE INDEX IF NOT EXISTS idx_agent_events_user ON agent_run_events(user_id, id);
  CREATE INDEX IF NOT EXISTS idx_agent_records_user ON agent_domain_records(user_id, agent, record_type);
`);

const json = (value, fallback = {}) => { try { return JSON.parse(value); } catch { return fallback; } };
const id = () => crypto.randomUUID();

export function ensureAgentProfile(userId, agent) {
  db.prepare("INSERT OR IGNORE INTO agent_profiles (user_id, agent) VALUES (?, ?)").run(userId, agent);
  return getAgentProfile(userId, agent);
}
export function getAgentProfile(userId, agent) {
  const row = db.prepare("SELECT * FROM agent_profiles WHERE user_id=? AND agent=?").get(userId, agent);
  return row ? { agent, profile: json(row.profile_json), policy: json(row.policy_json), migratedAt: row.migrated_at } : null;
}
export function updateAgentProfile(userId, agent, profile, policy) {
  ensureAgentProfile(userId, agent);
  db.prepare("UPDATE agent_profiles SET profile_json=?, policy_json=?, updated_at=datetime('now') WHERE user_id=? AND agent=?")
    .run(JSON.stringify(profile), JSON.stringify(policy), userId, agent);
  return getAgentProfile(userId, agent);
}
export function migrateLegacyAgent(userId, agent, legacy) {
  ensureAgentProfile(userId, agent);
  const row = db.prepare("SELECT migrated_at FROM agent_profiles WHERE user_id=? AND agent=?").get(userId, agent);
  if (row?.migrated_at) return false;
  const profile = agent === "career"
    ? { resume: String(legacy?.resume || ""), draft: String(legacy?.aiDraft || ""), confirmedClaims: [] }
    : { notesHtml: String(legacy?.docHtml || ""), connections: Array.isArray(legacy?.connections) ? legacy.connections : [], weeklyFocus: Array.isArray(legacy?.calendarFocus) ? legacy.calendarFocus : [] };
  db.prepare("UPDATE agent_profiles SET profile_json=?, migrated_at=datetime('now'), updated_at=datetime('now') WHERE user_id=? AND agent=?")
    .run(JSON.stringify(profile), userId, agent);
  return true;
}
export function createConversation(userId, agent, title = "New conversation") {
  const conversation = { id: id(), userId, agent, title: String(title).slice(0, 80) };
  db.prepare("INSERT INTO agent_conversations (id,user_id,agent,title) VALUES (@id,@userId,@agent,@title)").run(conversation);
  return conversation;
}
export function listConversations(userId, agent) {
  return db.prepare("SELECT id,agent,title,created_at AS createdAt,updated_at AS updatedAt FROM agent_conversations WHERE user_id=? AND agent=? ORDER BY updated_at DESC LIMIT 30").all(userId, agent);
}
export function getConversation(userId, conversationId) {
  const conversation = db.prepare("SELECT * FROM agent_conversations WHERE id=? AND user_id=?").get(conversationId, userId);
  if (!conversation) return null;
  return { id: conversation.id, agent: conversation.agent, title: conversation.title, messages: db.prepare("SELECT id,role,content,created_at AS createdAt FROM agent_messages WHERE conversation_id=? AND user_id=? ORDER BY rowid").all(conversationId, userId) };
}
export function addMessage(userId, conversationId, role, content) {
  const message = { id: id(), conversationId, userId, role, content: String(content).slice(0, 20_000) };
  db.prepare("INSERT INTO agent_messages (id,conversation_id,user_id,role,content) VALUES (@id,@conversationId,@userId,@role,@content)").run(message);
  db.prepare("UPDATE agent_conversations SET updated_at=datetime('now') WHERE id=? AND user_id=?").run(conversationId, userId);
  return message;
}
export function createTaskRun(userId, agent, conversationId, title, input) {
  const taskId = id(), runId = id();
  db.transaction(() => {
    db.prepare("INSERT INTO agent_tasks (id,user_id,agent,conversation_id,title,state) VALUES (?,?,?,?,?,'queued')").run(taskId,userId,agent,conversationId,String(title).slice(0,120));
    db.prepare("INSERT INTO agent_runs (id,task_id,user_id,agent,state,input_json) VALUES (?,?,?,?,'queued',?)").run(runId,taskId,userId,agent,JSON.stringify(input));
    addRunEvent(runId,userId,"queued",{ title: String(title).slice(0,120) });
  })();
  return { taskId, runId };
}
export function addRunEvent(runId, userId, eventType, data = {}) {
  db.prepare("INSERT INTO agent_run_events (run_id,user_id,event_type,data_json) VALUES (?,?,?,?)").run(runId,userId,eventType,JSON.stringify(data));
}
export function listRunEvents(userId, after = 0, agent = null) {
  return db.prepare("SELECT e.id,e.run_id AS runId,e.event_type AS type,e.data_json AS data,e.created_at AS createdAt FROM agent_run_events e JOIN agent_runs r ON r.id=e.run_id WHERE e.user_id=? AND e.id>? AND (? IS NULL OR r.agent=?) ORDER BY e.id LIMIT 200").all(userId,after,agent,agent).map((row)=>({...row,data:json(row.data)}));
}
export function leaseNextRun() {
  const row = db.prepare("SELECT * FROM agent_runs WHERE available_at<=datetime('now') AND (state='queued' OR (state='running' AND lease_until<datetime('now'))) ORDER BY created_at LIMIT 1").get();
  if (!row) return null;
  const changed = db.prepare("UPDATE agent_runs SET state='running',lease_until=datetime('now','+2 minutes'),attempt_count=attempt_count+1,updated_at=datetime('now') WHERE id=? AND (state='queued' OR (state='running' AND lease_until<datetime('now')))").run(row.id);
  if (!changed.changes) return null;
  addRunEvent(row.id,row.user_id,"running",{});
  return { ...row, input: json(row.input_json) };
}
export function finishRun(runId, userId, state, output = {}, errorCode = null) {
  db.prepare("UPDATE agent_runs SET state=?,output_json=?,error_code=?,lease_until=NULL,updated_at=datetime('now') WHERE id=? AND user_id=?").run(state,JSON.stringify(output),errorCode,runId,userId);
  db.prepare("UPDATE agent_tasks SET state=?,updated_at=datetime('now') WHERE id=(SELECT task_id FROM agent_runs WHERE id=?) AND user_id=?").run(state,runId,userId);
  addRunEvent(runId,userId,state,output);
}
export function cancelRun(userId, runId) {
  const result = db.prepare("UPDATE agent_runs SET state='cancelled',lease_until=NULL,updated_at=datetime('now') WHERE id=? AND user_id=? AND state IN ('queued','running','scheduled','awaiting_approval')").run(runId,userId);
  if (result.changes) finishRun(runId,userId,"cancelled",{});
  return Boolean(result.changes);
}
export function listTasks(userId, agent) {
  return db.prepare("SELECT t.id,t.title,t.state,t.created_at AS createdAt,t.updated_at AS updatedAt,r.id AS runId FROM agent_tasks t LEFT JOIN agent_runs r ON r.task_id=t.id WHERE t.user_id=? AND t.agent=? ORDER BY t.updated_at DESC LIMIT 100").all(userId,agent);
}
export function countTodayRuns(userId, agent) { return db.prepare("SELECT count(*) AS count FROM agent_runs WHERE user_id=? AND agent=? AND date(created_at)=date('now')").get(userId,agent).count; }
export function createApproval(userId, agent, runId, action) {
  const approval = { id:id(), userId, agent, runId, actionType:action.type, actionJson:JSON.stringify(action), summary:String(action.summary || action.type).slice(0,240) };
  db.prepare("INSERT INTO agent_approvals (id,run_id,user_id,agent,action_type,action_json,summary) VALUES (@id,@runId,@userId,@agent,@actionType,@actionJson,@summary)").run(approval);
  addRunEvent(runId,userId,"approval_required",{ approvalId:approval.id, actionType:approval.actionType, summary:approval.summary });
  return { ...approval, action };
}
export function listApprovals(userId, agent) {
  return db.prepare("SELECT id,run_id AS runId,agent,action_type AS actionType,action_json AS action,summary,status,created_at AS createdAt FROM agent_approvals WHERE user_id=? AND (? IS NULL OR agent=?) ORDER BY created_at DESC LIMIT 100").all(userId,agent || null,agent || null).map((row)=>({...row,action:json(row.action)}));
}
export function decideApproval(userId, approvalId, status) {
  const row = db.prepare("SELECT * FROM agent_approvals WHERE id=? AND user_id=?").get(approvalId,userId);
  if (!row || row.status !== "pending") return null;
  db.prepare("UPDATE agent_approvals SET status=?,decided_at=datetime('now') WHERE id=? AND user_id=?").run(status,approvalId,userId);
  return { ...row, action:json(row.action_json), status };
}
export function markApprovalExecuted(userId, approvalId) {
  db.prepare("UPDATE agent_approvals SET status='executed',executed_at=datetime('now') WHERE id=? AND user_id=?").run(approvalId,userId);
}
export function resetApproval(userId, approvalId) { db.prepare("UPDATE agent_approvals SET status='pending',decided_at=NULL WHERE id=? AND user_id=? AND status='approved'").run(approvalId,userId); }
export function pendingApprovalCount(userId, runId) { return db.prepare("SELECT count(*) AS count FROM agent_approvals WHERE user_id=? AND run_id=? AND status='pending'").get(userId,runId).count; }
export function saveDomainRecord(userId, agent, record) {
  const value={id:record.id||id(),userId,agent,recordType:record.recordType||"note",title:String(record.title||"Untitled").slice(0,160),status:record.status||"active",data:JSON.stringify(record.data||{}),sourceUrl:record.sourceUrl||null};
  db.prepare("INSERT INTO agent_domain_records (id,user_id,agent,record_type,title,status,data_json,source_url) VALUES (@id,@userId,@agent,@recordType,@title,@status,@data,@sourceUrl) ON CONFLICT(id) DO UPDATE SET title=excluded.title,status=excluded.status,data_json=excluded.data_json,source_url=excluded.source_url,updated_at=datetime('now')").run(value);
  return { ...record, id:value.id };
}
export function listDomainRecords(userId, agent) {
  return db.prepare("SELECT id,record_type AS recordType,title,status,data_json AS data,source_url AS sourceUrl,created_at AS createdAt,updated_at AS updatedAt FROM agent_domain_records WHERE user_id=? AND agent=? ORDER BY updated_at DESC LIMIT 200").all(userId,agent).map((row)=>({...row,data:json(row.data)}));
}
export function getConnector(userId, provider) { return db.prepare("SELECT * FROM connector_accounts WHERE user_id=? AND provider=?").get(userId,provider); }
export function saveConnector(userId, provider, accountLabel, scopes, encryptedTokens, expiresAt) {
  const connectorId=id();
  db.prepare("INSERT INTO connector_accounts (id,user_id,provider,account_label,scopes_json,encrypted_tokens,expires_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,provider) DO UPDATE SET account_label=excluded.account_label,scopes_json=excluded.scopes_json,encrypted_tokens=excluded.encrypted_tokens,expires_at=excluded.expires_at,updated_at=datetime('now')").run(connectorId,userId,provider,accountLabel,JSON.stringify(scopes),encryptedTokens,expiresAt||null);
}
export function listConnectors(userId) { return db.prepare("SELECT provider,account_label AS accountLabel,scopes_json AS scopes,expires_at AS expiresAt,updated_at AS updatedAt FROM connector_accounts WHERE user_id=?").all(userId).map((row)=>({...row,scopes:json(row.scopes,[])})); }
export function deleteConnector(userId, provider) { return db.prepare("DELETE FROM connector_accounts WHERE user_id=? AND provider=?").run(userId,provider).changes; }
export function beginConnectorAction(userId, approvalId, provider, actionType, idempotencyKey) {
  const existing=db.prepare("SELECT * FROM connector_actions WHERE idempotency_key=? AND user_id=?").get(idempotencyKey,userId);
  if (existing?.outcome==="success") return { state:"success",providerRef:existing.provider_ref };
  if (existing?.outcome==="started") return { state:"ambiguous" };
  if (existing) db.prepare("UPDATE connector_actions SET outcome='started',error_code=NULL WHERE id=? AND user_id=?").run(existing.id,userId);
  else db.prepare("INSERT INTO connector_actions (id,user_id,approval_id,provider,action_type,idempotency_key,outcome) VALUES (?,?,?,?,?,?,'started')").run(id(),userId,approvalId,provider,actionType,idempotencyKey);
  return { state:"ready" };
}
export function finishConnectorAction(userId, idempotencyKey, outcome, providerRef=null, errorCode=null) {
  db.prepare("UPDATE connector_actions SET outcome=?,provider_ref=?,error_code=? WHERE idempotency_key=? AND user_id=?").run(outcome,providerRef,errorCode,idempotencyKey,userId);
}
