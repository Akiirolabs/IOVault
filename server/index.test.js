// @vitest-environment node
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createUser, listAiUsageEvents } from "./db.js";
import { signToken } from "./auth.js";

let app;
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  ({ app } = await import("./index.js"));
});

beforeEach(() => {
  app.locals.aiRateLimiter.reset();
  app.locals.aiConfigured = false;
  app.locals.aiClient = null;
});

describe("Code Vault API authentication", () => {
  it("protects repository and scratch endpoints", async () => {
    await request(app).get("/api/code/github/repositories").expect(401);
    const result = await request(app).get("/api/code/scratch").expect(401);
    expect(result.body.error).toBe("Not authenticated.");
  });
});

describe("AI agent security", () => {
  const token = signToken({ id: "agent-validation-user", email: "agent@example.com" });

  it("rejects anonymous and malformed bearer requests", async () => {
    await request(app).post("/api/agent").send({ message: "hello" }).expect(401);
    await request(app).post("/api/agent").set("Authorization", "Bearer invalid").send({ message: "hello" }).expect(401);
  });

  it("validates authenticated payloads before checking provider configuration", async () => {
    await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({}).expect(400);
    await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({ message: "x".repeat(8_001) }).expect(413);
    await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({ message: "ok", vaultData: { text: "x".repeat(513 * 1024) } }).expect(413);
    const missingKey = await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({ message: "ok" }).expect(400);
    expect(missingKey.body.error).toMatch(/OPENAI_API_KEY/);
  });

  it("returns Retry-After when an authenticated user exceeds the AI limit", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({}).expect(400);
    }
    const limited = await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({}).expect(429);
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("returns a completion and stores privacy-safe usage metadata", async () => {
    const user = { id: `agent-success-${Date.now()}`, email: `success-${Date.now()}@example.com` };
    createUser({ ...user, passwordHash: "unused" });
    app.locals.aiConfigured = true;
    app.locals.aiClient = { chat: { completions: { create: async () => ({ choices: [{ message: { content: "Done" } }], usage: { prompt_tokens: 12, completion_tokens: 4 } }) } } };
    const secret = "PRIVATE_VAULT_VALUE";
    const result = await request(app).post("/api/agent").set("Authorization", `Bearer ${signToken(user)}`).send({ message: "Help", vaultData: { secret } }).expect(200);
    expect(result.body.answer).toBe("Done");
    const events = listAiUsageEvents(user.id);
    expect(events[0]).toMatchObject({ outcome: "success", prompt_chars: 4, input_tokens: 12, output_tokens: 4 });
    expect(JSON.stringify(events)).not.toContain(secret);
    expect(JSON.stringify(events)).not.toContain("Help");
  });

  it("maps provider timeout and upstream failures without leaking details", async () => {
    const user = { id: `agent-errors-${Date.now()}`, email: `errors-${Date.now()}@example.com` };
    createUser({ ...user, passwordHash: "unused" });
    const auth = `Bearer ${signToken(user)}`;
    app.locals.aiConfigured = true;
    app.locals.aiClient = { chat: { completions: { create: async () => { const error = new Error("provider secret"); error.name = "APIConnectionTimeoutError"; throw error; } } } };
    const timeout = await request(app).post("/api/agent").set("Authorization", auth).send({ message: "Help" }).expect(504);
    expect(timeout.body.error).not.toContain("provider secret");
    app.locals.aiClient = { chat: { completions: { create: async () => { throw new Error("provider secret"); } } } };
    const failure = await request(app).post("/api/agent").set("Authorization", auth).send({ message: "Help again" }).expect(502);
    expect(failure.body.error).not.toContain("provider secret");
  });
});
