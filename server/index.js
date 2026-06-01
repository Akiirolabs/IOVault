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

const app = express();
const port = Number(process.env.API_PORT || 8787);
const model = "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: "1mb" }));

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
