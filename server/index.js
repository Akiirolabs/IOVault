/**
 * IO Vault API server (Express).
 * Run with: npm run dev:api  (or together via npm run dev)
 *
 * Loads secrets from .env.local, exposes POST /api/agent for the in-app AI assistant.
 */

import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import crypto from "node:crypto";

// Load API keys: .env.local overrides, then optional .env
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: false });

import {
  createUser,
  findUserByEmail,
  findUserById,
  getWorkspace,
  recordAiUsageEvent,
  saveWorkspace,
} from "./db.js";
import {
  hashPassword,
  newId,
  requireAuth,
  signToken,
  verifyPassword,
} from "./auth.js";
import {
  consumeGithubState,
  createGithubState,
  deleteGithubInstallation,
  deleteScratchFile,
  getGithubInstallation,
  getPatchSet,
  listScratchFiles,
  saveGithubInstallation,
  savePatchSet,
  savePublication,
  upsertScratchFile,
} from "./code-db.js";
import {
  getInstallationDetails,
  githubConfigured,
  listInstallationRepositories,
  publishPatch,
  repositoryFile,
  repositoryTree,
  validRepositoryPath,
} from "./github.js";
import { createAiRateLimiter, validateAgentRequest } from "./ai-security.js";

const app = express();
const port = Number(process.env.API_PORT || 8787);
const model = "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY;
const codeModelBalanced = process.env.OPENAI_CODE_MODEL_BALANCED || "gpt-5.4-mini";
const codeModelBest = process.env.OPENAI_CODE_MODEL_BEST || "gpt-5.6";
const aiRateLimiter = createAiRateLimiter();
const aiLimiterCleanup = setInterval(() => aiRateLimiter.cleanup(), 60_000);
aiLimiterCleanup.unref?.();

app.use(express.json({ limit: "2mb" }));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user.id, email: user.email };
}

/**
 * Sign up — create an account.
 * Body: { email, password } → { token, user } | { error }
 */
app.post("/api/auth/signup", async (request, response) => {
  const email = String(request.body?.email || "").trim().toLowerCase();
  const password = String(request.body?.password || "");

  if (!EMAIL_PATTERN.test(email)) {
    response.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (password.length < 8) {
    response.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  if (findUserByEmail(email)) {
    response.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  try {
    const user = { id: newId(), email };
    await createUser({ id: user.id, email, passwordHash: await hashPassword(password) });
    response.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Signup failed:", error);
    response.status(500).json({ error: "Could not create account." });
  }
});

/**
 * Log in — verify credentials.
 * Body: { email, password } → { token, user } | { error }
 */
app.post("/api/auth/login", async (request, response) => {
  const email = String(request.body?.email || "").trim().toLowerCase();
  const password = String(request.body?.password || "");

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    response.status(401).json({ error: "Invalid email or password." });
    return;
  }

  response.json({ token: signToken(user), user: publicUser(user) });
});

/** Current user from the Bearer token. */
app.get("/api/auth/me", requireAuth, (request, response) => {
  const user = findUserById(request.userId);
  if (!user) {
    response.status(404).json({ error: "User not found." });
    return;
  }
  response.json({ user: { id: user.id, email: user.email } });
});

/** Load this user's saved VaultState (or null if none yet). */
app.get("/api/vault", requireAuth, (request, response) => {
  const workspace = getWorkspace(request.userId);
  response.json({ data: workspace?.data ?? null, updatedAt: workspace?.updatedAt ?? null });
});

/** Save (upsert) this user's full VaultState. */
app.put("/api/vault", requireAuth, (request, response) => {
  const data = request.body?.data;
  if (!data || typeof data !== "object") {
    response.status(400).json({ error: "Vault data must be an object." });
    return;
  }

  try {
    saveWorkspace(request.userId, data);
    response.json({ ok: true });
  } catch (error) {
    console.error("Vault save failed:", error);
    response.status(500).json({ error: "Could not save vault." });
  }
});

/**
 * AI agent endpoint — called from the frontend drawer and Career "AI Revise".
 * Body: { message: string, context?: { scope: string, data: object } }
 * Returns: { answer: string, model: string } or { error: string }
 */
app.locals.aiConfigured = Boolean(apiKey && apiKey !== "your_key_here");
app.locals.aiClient = app.locals.aiConfigured ? new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 }) : null;
app.locals.aiRateLimiter = aiRateLimiter;

app.post("/api/agent", requireAuth, aiRateLimiter.middleware, async (request, response) => {
  const validation = validateAgentRequest(request.body);
  if (validation.error) {
    response.status(validation.status).json({ error: validation.error });
    return;
  }
  const { message, serializedContext, contextBytes } = validation;

  if (!app.locals.aiConfigured || !app.locals.aiClient) {
    response.status(400).json({
      error: "Missing OPENAI_API_KEY in .env.local.",
    });
    return;
  }

  const audit = (outcome, usage = {}) => {
    try {
      recordAiUsageEvent({
        userId: request.userId,
        route: "/api/agent",
        model,
        outcome,
        promptChars: message.length,
        contextBytes,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      });
    } catch (auditError) {
      console.error("AI usage audit failed:", auditError?.name || "Unknown error");
    }
  };

  try {
    const completion = await app.locals.aiClient.chat.completions.create({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You are the IO Vault AI assistant. Be concise, helpful, and organized. Use only the explicitly selected context included in the request. If context is absent or insufficient, say what information you need instead of assuming access to the user's vault.",
        },
        {
          role: "user",
          // Full workspace snapshot so the model can answer in context
          content: JSON.stringify({
            message,
            ...(serializedContext !== null ? { context: JSON.parse(serializedContext) } : {}),
          }),
        },
      ],
    });

    audit("success", completion.usage);

    response.json({
      answer: completion.choices[0]?.message?.content || "I could not generate an answer.",
      model,
    });
  } catch (error) {
    console.error("OpenAI request failed:", error?.name || "Unknown error");
    const timedOut = error?.name === "APIConnectionTimeoutError" || error?.code === "ETIMEDOUT";
    audit(timedOut ? "timeout" : "upstream_error");
    response.status(timedOut ? 504 : 502).json({ error: timedOut ? "The AI service timed out. Try again." : "The AI service is temporarily unavailable." });
  }
});

// --- Code Vault: GitHub App, scratch workspaces, AI patches, and publishing ---

app.post("/api/code/github/connect", requireAuth, (request, response) => {
  if (!githubConfigured()) {
    response.status(503).json({ error: "Configure GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_APP_SLUG first." });
    return;
  }
  const state = crypto.randomBytes(24).toString("hex");
  createGithubState(state, request.userId);
  response.json({ installUrl: `https://github.com/apps/${encodeURIComponent(process.env.GITHUB_APP_SLUG)}/installations/new?state=${state}` });
});

app.get("/api/code/github/callback", async (request, response) => {
  const state = String(request.query.state || "");
  const installationId = String(request.query.installation_id || "");
  const userId = consumeGithubState(state);
  const appOrigin = process.env.APP_ORIGIN || "http://localhost:5173";
  if (!userId || !/^\d+$/.test(installationId)) {
    response.redirect(`${appOrigin}/?github=error`);
    return;
  }
  try {
    const installation = await getInstallationDetails(installationId);
    saveGithubInstallation(userId, installationId, installation.account?.login || null);
    response.redirect(`${appOrigin}/?github=connected`);
  } catch (error) {
    console.error("GitHub installation callback failed:", error);
    response.redirect(`${appOrigin}/?github=error`);
  }
});

app.get("/api/code/github/repositories", requireAuth, async (request, response) => {
  const configured = githubConfigured();
  const connected = Boolean(getGithubInstallation(request.userId));
  if (!configured || !connected) {
    response.json({ configured, connected, repositories: [] });
    return;
  }
  try {
    response.json({ configured, connected, repositories: await listInstallationRepositories(request.userId) });
  } catch (error) {
    response.status(error.status || 502).json({ error: error.message });
  }
});

app.delete("/api/code/github/disconnect", requireAuth, (request, response) => {
  deleteGithubInstallation(request.userId);
  response.json({ ok: true });
});

app.get("/api/code/github/tree", requireAuth, async (request, response) => {
  try {
    response.json(await repositoryTree(request.userId, String(request.query.repository || ""), String(request.query.ref || "")));
  } catch (error) {
    response.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/code/github/file", requireAuth, async (request, response) => {
  try {
    response.json(await repositoryFile(request.userId, String(request.query.repository || ""), String(request.query.ref || ""), String(request.query.path || "")));
  } catch (error) {
    response.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/code/scratch", requireAuth, (request, response) => {
  response.json({ files: listScratchFiles(request.userId, String(request.query.workspaceId || "scratch")) });
});

app.put("/api/code/scratch/:id", requireAuth, (request, response) => {
  const file = request.body || {};
  if (!validRepositoryPath(file.path) || typeof file.content !== "string" || file.content.length > 1024 * 1024) {
    response.status(400).json({ error: "Invalid scratch file." });
    return;
  }
  upsertScratchFile(request.userId, { id: request.params.id, workspaceId: String(file.workspaceId || "scratch"), path: file.path, language: String(file.language || "plaintext"), content: file.content });
  response.json({ ok: true });
});

app.delete("/api/code/scratch/:id", requireAuth, (request, response) => {
  response.json({ ok: deleteScratchFile(request.userId, request.params.id) });
});

app.post("/api/code/patch-sets", requireAuth, (request, response) => {
  const repository = String(request.body?.repository || "");
  const baseBranch = String(request.body?.baseBranch || "");
  const baseSha = String(request.body?.baseSha || "");
  const changes = Array.isArray(request.body?.changes) ? request.body.changes : [];
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !baseBranch || !/^[a-f0-9]{40}$/i.test(baseSha) || changes.length < 1 || changes.length > 50) {
    response.status(400).json({ error: "Invalid patch-set metadata." });
    return;
  }
  const normalizedChanges = changes.map((change) => ({
    id: crypto.randomUUID(),
    operation: change.operation,
    path: String(change.path || ""),
    content: String(change.content || ""),
    rationale: String(change.rationale || "Manual change"),
    accepted: true,
  }));
  if (normalizedChanges.some((change) => !["create", "update", "delete"].includes(change.operation) || !validRepositoryPath(change.path) || change.content.length > 1024 * 1024)) {
    response.status(400).json({ error: "One or more file changes is invalid." });
    return;
  }
  const summary = String(request.body?.summary || "Manual code changes").slice(0, 200);
  const patchSet = { id: crypto.randomUUID(), summary, explanation: summary, warnings: [], contextFiles: [], repository, baseBranch, baseSha, changes: normalizedChanges };
  savePatchSet(request.userId, patchSet);
  response.json({ patchSet });
});

const codePatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "explanation", "warnings", "changes"],
  properties: {
    summary: { type: "string" },
    explanation: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["operation", "path", "content", "rationale"],
        properties: {
          operation: { type: "string", enum: ["create", "update", "delete"] },
          path: { type: "string" },
          content: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
  },
};

app.post("/api/code/assist/stream", requireAuth, async (request, response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  const send = (payload) => response.write(`data: ${JSON.stringify(payload)}\n\n`);
  const files = Array.isArray(request.body?.files) ? request.body.files : [];
  const totalCharacters = files.reduce((total, file) => total + String(file?.content || "").length, 0);
  if (!apiKey || apiKey === "your_key_here") {
    send({ type: "error", error: "Missing OPENAI_API_KEY in .env.local." }); response.end(); return;
  }
  if (!String(request.body?.prompt || "").trim() || files.length < 1 || files.length > 12 || totalCharacters > 300_000) {
    send({ type: "error", error: "Provide 1–12 context files totaling no more than 300,000 characters." }); response.end(); return;
  }
  if (files.some((file) => !validRepositoryPath(file.path) || typeof file.content !== "string")) {
    send({ type: "error", error: "One or more context files has an invalid path or content." }); response.end(); return;
  }
  send({ type: "status", message: "Analyzing selected context…" });
  try {
    const openai = new OpenAI({ apiKey });
    const result = await openai.responses.create({
      model: request.body.quality === "best" ? codeModelBest : codeModelBalanced,
      instructions: "You are the IO Vault coding assistant. Work only from the supplied task and context files. Return safe, minimal, complete-file changes. Never invent hidden repository content. For questions or explanations that need no edit, return an empty changes array. Deletions must use an empty content string.",
      input: JSON.stringify({ action: request.body.action, task: request.body.prompt, repository: request.body.repository || null, baseBranch: request.body.baseBranch || null, scratchpad: request.body.scratchpad || null, files }),
      text: { format: { type: "json_schema", name: "code_patch", strict: true, schema: codePatchSchema } },
    });
    const parsed = JSON.parse(result.output_text || "{}");
    const changes = (Array.isArray(parsed.changes) ? parsed.changes : []).map((change) => ({ ...change, id: crypto.randomUUID(), accepted: true }));
    if (changes.some((change) => !validRepositoryPath(change.path) || (change.operation !== "delete" && typeof change.content !== "string"))) throw new Error("The assistant returned an invalid file path or change.");
    const patchSet = {
      id: crypto.randomUUID(),
      summary: parsed.summary || "Code changes",
      explanation: parsed.explanation || "",
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      contextFiles: files.map((file) => file.path),
      repository: request.body.repository || undefined,
      baseBranch: request.body.baseBranch || undefined,
      baseSha: request.body.baseSha || undefined,
      changes,
    };
    savePatchSet(request.userId, patchSet);
    send({ type: "result", patchSet });
  } catch (error) {
    console.error("Code assistant failed:", error);
    send({ type: "error", error: "The coding assistant could not produce a valid patch. Check model access and try again." });
  } finally {
    response.end();
  }
});

app.post("/api/code/publish", requireAuth, async (request, response) => {
  const row = getPatchSet(request.userId, String(request.body?.patchSetId || ""));
  if (!row) { response.status(404).json({ error: "Patch set not found." }); return; }
  const acceptedIds = new Set(Array.isArray(request.body?.acceptedChangeIds) ? request.body.acceptedChangeIds : []);
  const patchSet = { ...row.data, changes: row.data.changes.map((change) => ({ ...change, accepted: acceptedIds.has(change.id) })) };
  if (!patchSet.repository || !patchSet.baseBranch || !patchSet.baseSha) { response.status(400).json({ error: "Only GitHub-backed patch sets can be published." }); return; }
  try {
    const publication = await publishPatch(request.userId, patchSet, String(request.body?.title || patchSet.summary), request.body?.draft !== false);
    savePublication(request.userId, { patchSetId: patchSet.id, repository: patchSet.repository, ...publication });
    response.json(publication);
  } catch (error) {
    response.status(error.status || 502).json({ error: error.message });
  }
});

export { app };

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`IO Vault API running on http://localhost:${port}`);
  });
}
