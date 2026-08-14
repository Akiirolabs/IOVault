// @vitest-environment node
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, listAiUsageEvents } from "./db.js";
import { SESSION_COOKIE_NAME, signToken } from "./auth.js";

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

describe("HttpOnly cookie sessions", () => {
  it("sets a protected cookie without returning the JWT and supports logout", async () => {
    const agent = request.agent(app);
    const email = `cookie-${Date.now()}@example.com`;
    const signup = await agent.post("/api/auth/signup").send({ email, password: "secure-password" }).expect(200);
    expect(signup.body.user.email).toBe(email);
    expect(signup.body.token).toBeUndefined();
    const cookie = signup.headers["set-cookie"]?.[0] || "";
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");

    await agent.get("/api/auth/me").expect(200);
    await agent.post("/api/auth/logout").expect(403);
    const logout = await agent.post("/api/auth/logout").set("X-IOVault-CSRF", "1").expect(200);
    expect(logout.headers["set-cookie"]?.[0]).toContain("Max-Age=0");
    await agent.get("/api/auth/me").expect(401);

    const login = await agent.post("/api/auth/login").send({ email, password: "secure-password" }).expect(200);
    expect(login.body.token).toBeUndefined();
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    await agent.get("/api/auth/me").expect(200);
  });

  it("requires CSRF protection for cookie-authenticated mutations", async () => {
    const user = { id: `csrf-${Date.now()}`, email: `csrf-${Date.now()}@example.com` };
    createUser({ ...user, passwordHash: "unused" });
    const cookie = `${SESSION_COOKIE_NAME}=${signToken(user)}`;
    await request(app).post("/api/agent").set("Cookie", cookie).send({ message: "hello" }).expect(403);
    await request(app).post("/api/agent").set("Cookie", cookie).set("X-IOVault-CSRF", "1").send({}).expect(400);
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
    await request(app).post("/api/agent").set("Authorization", `Bearer ${token}`).send({ message: "ok", context: { text: "x".repeat(65 * 1024) } }).expect(413);
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
    let outboundRequest;
    app.locals.aiClient = { chat: { completions: { create: async (input) => { outboundRequest = input; return { choices: [{ message: { content: "Done" } }], usage: { prompt_tokens: 12, completion_tokens: 4 } }; } } } };
    const secret = "PRIVATE_VAULT_VALUE";
    const result = await request(app).post("/api/agent").set("Authorization", `Bearer ${signToken(user)}`).send({ message: "Help", context: { scope: "career", data: { resume: secret } } }).expect(200);
    expect(result.body.answer).toBe("Done");
    expect(JSON.stringify(outboundRequest)).toContain(secret);
    const events = listAiUsageEvents(user.id);
    expect(events[0]).toMatchObject({ outcome: "success", prompt_chars: 4, input_tokens: 12, output_tokens: 4 });
    expect(JSON.stringify(events)).not.toContain(secret);
    expect(JSON.stringify(events)).not.toContain("Help");
  });

  it("ignores legacy full-vault payloads and sends only selected context", async () => {
    const user = { id: `agent-context-${Date.now()}`, email: `context-${Date.now()}@example.com` };
    createUser({ ...user, passwordHash: "unused" });
    let outboundRequest;
    app.locals.aiConfigured = true;
    app.locals.aiClient = { chat: { completions: { create: async (input) => { outboundRequest = input; return { choices: [{ message: { content: "Done" } }] }; } } } };
    await request(app).post("/api/agent").set("Authorization", `Bearer ${signToken(user)}`).send({
      message: "Help",
      vaultData: { secret: "ENTIRE_VAULT_SECRET" },
      context: { scope: "projects", data: { title: "SELECTED_PROJECT" } },
    }).expect(200);
    const serialized = JSON.stringify(outboundRequest);
    expect(serialized).toContain("SELECTED_PROJECT");
    expect(serialized).not.toContain("ENTIRE_VAULT_SECRET");
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

describe("Learning and Career agent API", () => {
  it("mints a bounded semantic-VAD secret and accepts only idempotent user transcripts", async () => {
    const user={id:`realtime-${Date.now()}`,email:`realtime-${Date.now()}@example.com`};createUser({...user,passwordHash:"unused"});
    const cookie=`${SESSION_COOKIE_NAME}=${signToken(user)}`;
    await request(app).post("/api/agents/learning/realtime/session").expect(401);
    await request(app).post("/api/agents/learning/realtime/session").set("Cookie",cookie).expect(403);
    app.locals.realtimeApiKey="server-standard-key";
    const upstream=vi.fn().mockResolvedValue({ok:true,json:async()=>({value:"short-lived-secret",expires_at:123})});vi.stubGlobal("fetch",upstream);
    const minted=await request(app).post("/api/agents/learning/realtime/session").set("Cookie",cookie).set("X-IOVault-CSRF","1").send({}).expect(200);
    expect(minted.headers["cache-control"]).toBe("no-store");expect(minted.body.value).toBe("short-lived-secret");expect(JSON.stringify(minted.body)).not.toContain("server-standard-key");
    const providerRequest=JSON.parse(upstream.mock.calls[0][1].body);expect(providerRequest.session).toMatchObject({model:"gpt-realtime-2.1-mini",output_modalities:["audio"],audio:{input:{turn_detection:{type:"semantic_vad",interrupt_response:true}}}});expect(providerRequest.session.tools).toBeUndefined();
    const conversation=await request(app).post("/api/agents/learning/conversations").set("Cookie",cookie).set("X-IOVault-CSRF","1").send({}).expect(201);
    const transcriptPath="/api/agents/learning/realtime/transcripts",body={conversationId:conversation.body.conversation.id,role:"user",content:"Teach me closures",turnId:"voice-turn-1"};
    await request(app).post(transcriptPath).set("Cookie",cookie).set("X-IOVault-CSRF","1").send({...body,role:"assistant"}).expect(400);
    await request(app).post(transcriptPath).set("Cookie",cookie).set("X-IOVault-CSRF","1").send(body).expect(201);
    const duplicate=await request(app).post(transcriptPath).set("Cookie",cookie).set("X-IOVault-CSRF","1").send(body).expect(200);expect(duplicate.body.duplicate).toBe(true);
    vi.unstubAllGlobals();app.locals.realtimeApiKey=null;
  });
  it("requires authentication and CSRF before creating durable agent work", async () => {
    await request(app).get("/api/agents/learning").expect(401);
    await request(app).post("/api/agents/career/conversations").send({}).expect(401);
    const user = { id: `agent-api-${Date.now()}`, email: `agent-api-${Date.now()}@example.com` };
    createUser({ ...user, passwordHash: "unused" });
    const cookie = `${SESSION_COOKIE_NAME}=${signToken(user)}`;
    await request(app).post("/api/agents/learning/conversations").set("Cookie", cookie).send({}).expect(403);
    const conversation = await request(app).post("/api/agents/learning/conversations").set("Cookie", cookie).set("X-IOVault-CSRF", "1").send({}).expect(201);
    await request(app).post("/api/agents/learning/messages").set("Cookie", cookie).set("X-IOVault-CSRF", "1").send({ conversationId: conversation.body.conversation.id, message: "" }).expect(400);
    const run = await request(app).post("/api/agents/learning/messages").set("Cookie", cookie).set("X-IOVault-CSRF", "1").send({ conversationId: conversation.body.conversation.id, message: "Build a study plan" }).expect(202);
    expect(run.body.runId).toBeTruthy();
  });

  it("keeps conversations and migrated profiles isolated by user", async () => {
    const first = { id: `agent-owner-a-${Date.now()}`, email: `agent-owner-a-${Date.now()}@example.com` };
    const second = { id: `agent-owner-b-${Date.now()}`, email: `agent-owner-b-${Date.now()}@example.com` };
    createUser({ ...first, passwordHash: "unused" }); createUser({ ...second, passwordHash: "unused" });
    const firstAuth = `Bearer ${signToken(first)}`, secondAuth = `Bearer ${signToken(second)}`;
    await request(app).post("/api/agents/career/migrate").set("Authorization", firstAuth).send({ legacy: { resume: "PRIVATE CAREER PROFILE" } }).expect(200);
    const firstSnapshot = await request(app).get("/api/agents/career").set("Authorization", firstAuth).expect(200);
    const secondSnapshot = await request(app).get("/api/agents/career").set("Authorization", secondAuth).expect(200);
    expect(firstSnapshot.body.profile.resume).toBe("PRIVATE CAREER PROFILE");
    expect(JSON.stringify(secondSnapshot.body)).not.toContain("PRIVATE CAREER PROFILE");
    const conversation = await request(app).post("/api/agents/career/conversations").set("Authorization", firstAuth).send({}).expect(201);
    await request(app).get(`/api/agents/career/conversations/${conversation.body.conversation.id}`).set("Authorization", secondAuth).expect(404);
  });
});
