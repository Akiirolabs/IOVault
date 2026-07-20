/**
 * SQLite database for IO Vault (users + per-user workspace storage).
 *
 * SQLite is used as a free, zero-config SQL database that runs entirely in this
 * environment. The schema and access patterns are intentionally simple so the
 * store can later be swapped for Postgres (Supabase/Neon) — see docs/server-and-auth.md.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// DB file lives in server/data/ (git-ignored). Override with DATABASE_FILE.
const dataDir = path.join(currentDir, "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = process.env.DATABASE_FILE || path.join(dataDir, "iovault.db");

const db = new Database(dbFile);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_usage_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route TEXT NOT NULL,
    model TEXT NOT NULL,
    outcome TEXT NOT NULL,
    prompt_chars INTEGER NOT NULL,
    context_bytes INTEGER NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const statements = {
  insertUser: db.prepare(
    "INSERT INTO users (id, email, password_hash) VALUES (@id, @email, @passwordHash)",
  ),
  findUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  findUserById: db.prepare("SELECT id, email, created_at FROM users WHERE id = ?"),
  getWorkspace: db.prepare("SELECT data, updated_at FROM workspaces WHERE user_id = ?"),
  upsertWorkspace: db.prepare(`
    INSERT INTO workspaces (user_id, data, updated_at)
    VALUES (@userId, @data, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')
  `),
  insertAiUsageEvent: db.prepare(`
    INSERT INTO ai_usage_events
      (user_id, route, model, outcome, prompt_chars, context_bytes, input_tokens, output_tokens)
    VALUES
      (@userId, @route, @model, @outcome, @promptChars, @contextBytes, @inputTokens, @outputTokens)
  `),
  listAiUsageEvents: db.prepare("SELECT * FROM ai_usage_events WHERE user_id = ? ORDER BY id DESC"),
};

export function createUser({ id, email, passwordHash }) {
  statements.insertUser.run({ id, email, passwordHash });
}

export function findUserByEmail(email) {
  return statements.findUserByEmail.get(email);
}

export function findUserById(id) {
  return statements.findUserById.get(id);
}

/** Returns the stored VaultState (parsed) for a user, or null if none saved yet. */
export function getWorkspace(userId) {
  const row = statements.getWorkspace.get(userId);
  if (!row) return null;
  try {
    return { data: JSON.parse(row.data), updatedAt: row.updated_at };
  } catch {
    return { data: {}, updatedAt: row.updated_at };
  }
}

/** Upserts the full VaultState (as JSON) for a user. */
export function saveWorkspace(userId, data) {
  statements.upsertWorkspace.run({ userId, data: JSON.stringify(data) });
}

export function recordAiUsageEvent(event) {
  statements.insertAiUsageEvent.run({
    userId: event.userId,
    route: event.route,
    model: event.model,
    outcome: event.outcome,
    promptChars: event.promptChars,
    contextBytes: event.contextBytes,
    inputTokens: event.inputTokens ?? null,
    outputTokens: event.outputTokens ?? null,
  });
}

export function listAiUsageEvents(userId) {
  return statements.listAiUsageEvents.all(userId);
}

export default db;
