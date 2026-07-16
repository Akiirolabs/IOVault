import crypto from "node:crypto";
import db from "./db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS github_installations (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    installation_id TEXT NOT NULL,
    account_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS github_connection_states (
    state TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS code_workspaces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    repository TEXT,
    base_branch TEXT,
    base_sha TEXT,
    title TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scratch_files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL,
    path TEXT NOT NULL,
    language TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, workspace_id, path)
  );

  CREATE TABLE IF NOT EXISTS code_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    repository TEXT,
    previous_response_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patch_sets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    repository TEXT,
    base_branch TEXT,
    base_sha TEXT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS code_publications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patch_set_id TEXT NOT NULL,
    repository TEXT NOT NULL,
    branch TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    pull_request_url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const statements = {
  createState: db.prepare("INSERT INTO github_connection_states (state, user_id, expires_at) VALUES (?, ?, datetime('now', '+15 minutes'))"),
  consumeState: db.prepare("DELETE FROM github_connection_states WHERE state = ? AND expires_at > datetime('now') RETURNING user_id"),
  saveInstallation: db.prepare(`
    INSERT INTO github_installations (user_id, installation_id, account_login)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET installation_id = excluded.installation_id, account_login = excluded.account_login, updated_at = datetime('now')
  `),
  getInstallation: db.prepare("SELECT * FROM github_installations WHERE user_id = ?"),
  deleteInstallation: db.prepare("DELETE FROM github_installations WHERE user_id = ?"),
  savePatchSet: db.prepare("INSERT INTO patch_sets (id, user_id, session_id, repository, base_branch, base_sha, data) VALUES (@id, @userId, @sessionId, @repository, @baseBranch, @baseSha, @data)"),
  getPatchSet: db.prepare("SELECT * FROM patch_sets WHERE id = ? AND user_id = ?"),
  savePublication: db.prepare("INSERT INTO code_publications (id, user_id, patch_set_id, repository, branch, commit_sha, pull_request_url) VALUES (@id, @userId, @patchSetId, @repository, @branch, @commitSha, @pullRequestUrl)"),
  listScratch: db.prepare("SELECT * FROM scratch_files WHERE user_id = ? AND workspace_id = ? ORDER BY updated_at DESC"),
  upsertScratch: db.prepare(`
    INSERT INTO scratch_files (id, user_id, workspace_id, path, language, content, updated_at)
    VALUES (@id, @userId, @workspaceId, @path, @language, @content, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET workspace_id = excluded.workspace_id, path = excluded.path, language = excluded.language, content = excluded.content, updated_at = datetime('now')
  `),
  deleteScratch: db.prepare("DELETE FROM scratch_files WHERE id = ? AND user_id = ?"),
};

export function createGithubState(state, userId) { statements.createState.run(state, userId); }
export function consumeGithubState(state) { return statements.consumeState.get(state)?.user_id || null; }
export function saveGithubInstallation(userId, installationId, accountLogin = null) { statements.saveInstallation.run(userId, String(installationId), accountLogin); }
export function getGithubInstallation(userId) { return statements.getInstallation.get(userId) || null; }
export function deleteGithubInstallation(userId) { statements.deleteInstallation.run(userId); }

export function savePatchSet(userId, patchSet, sessionId = null) {
  statements.savePatchSet.run({
    id: patchSet.id,
    userId,
    sessionId,
    repository: patchSet.repository || null,
    baseBranch: patchSet.baseBranch || null,
    baseSha: patchSet.baseSha || null,
    data: JSON.stringify(patchSet),
  });
}

export function getPatchSet(userId, id) {
  const row = statements.getPatchSet.get(id, userId);
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data) };
}

export function savePublication(userId, publication) {
  statements.savePublication.run({ ...publication, userId, id: crypto.randomUUID() });
}

export function listScratchFiles(userId, workspaceId) { return statements.listScratch.all(userId, workspaceId); }
export function upsertScratchFile(userId, file) { statements.upsertScratch.run({ ...file, userId }); }
export function deleteScratchFile(userId, id) { return statements.deleteScratch.run(id, userId).changes > 0; }
