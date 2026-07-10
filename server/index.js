/**
 * IO Vault API server (Express).
 * Run with: npm run dev:api  (or together via npm run dev)
 *
 * Loads secrets from .env.local, exposes POST /api/agent for the in-app AI assistant.
 */

import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

// Load API keys: .env.local overrides, then optional .env
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: false });

import {
  createUser,
  findUserByEmail,
  findUserById,
  getWorkspace,
  saveWorkspace,
} from "./db.js";
import {
  hashPassword,
  newId,
  requireAuth,
  signToken,
  verifyPassword,
} from "./auth.js";

const app = express();
const port = Number(process.env.API_PORT || 8787);
const model = "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY;

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
 * Body: { message: string, vaultData?: object }
 * Returns: { answer: string, model: string } or { error: string }
 */
app.post("/api/agent", async (request, response) => {
  const message = String(request.body?.message || "").trim();
  const vaultData = request.body?.vaultData || {};

  if (!message) {
    response.status(400).json({ error: "Message is required." });
    return;
  }

  if (!apiKey || apiKey === "your_key_here") {
    response.status(400).json({
      error: "Missing OPENAI_API_KEY in .env.local.",
    });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You are the IO Vault AI assistant. Be concise, helpful, and organized. Help with general questions like ChatGPT, and use the user's vault data when it is relevant to code, learning, career applications, integrations, reminders, or finding saved information.",
        },
        {
          role: "user",
          // Full workspace snapshot so the model can answer in context
          content: JSON.stringify({
            message,
            vaultData,
          }),
        },
      ],
    });

    response.json({
      answer: completion.choices[0]?.message?.content || "I could not generate an answer.",
      model,
    });
  } catch (error) {
    console.error("OpenAI request failed:", error);
    response.status(500).json({
      error: "OpenAI request failed. Check your API key and billing status.",
    });
  }
});

app.listen(port, () => {
  console.log(`IO Vault API running on http://localhost:${port}`);
});
