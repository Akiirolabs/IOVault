// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createAiRateLimiter, validateAgentRequest } from "./ai-security.js";

describe("AI request security", () => {
  it("validates message and vault context limits", () => {
    expect(validateAgentRequest({}).status).toBe(400);
    expect(validateAgentRequest({ message: "x".repeat(8_000) }).message.length).toBe(8_000);
    expect(validateAgentRequest({ message: "x".repeat(8_001) }).status).toBe(413);
    expect(validateAgentRequest({ message: "ok", context: { text: "x".repeat(65 * 1024) } }).status).toBe(413);
    expect(validateAgentRequest({ message: " ok ", context: {} })).toMatchObject({ message: "ok", contextBytes: 2 });
    expect(validateAgentRequest({ message: "ok", vaultData: { ignored: true } })).toMatchObject({ context: null, contextBytes: 0 });
  });

  it("limits users and expires fixed windows", () => {
    let now = 1_000;
    const limiter = createAiRateLimiter({ userLimit: 2, ipLimit: 20, windowMs: 1_000, now: () => now });
    const request = { userId: "user-a", ip: "127.0.0.1" };
    const responses = [];
    const response = {
      set: (name, value) => responses.push([name, value]),
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    let allowed = 0;
    limiter.middleware(request, response, () => { allowed += 1; });
    limiter.middleware(request, response, () => { allowed += 1; });
    limiter.middleware(request, response, () => { allowed += 1; });
    expect(allowed).toBe(2);
    expect(response.statusCode).toBe(429);
    expect(responses).toContainEqual(["Retry-After", "1"]);
    now += 1_001;
    limiter.middleware(request, response, () => { allowed += 1; });
    expect(allowed).toBe(3);
  });

  it("isolates user counters while enforcing the shared IP counter", () => {
    const limiter = createAiRateLimiter({ userLimit: 10, ipLimit: 2 });
    const response = { set() {}, status(code) { this.statusCode = code; return this; }, json() {} };
    let allowed = 0;
    limiter.middleware({ userId: "a", ip: "same" }, response, () => { allowed += 1; });
    limiter.middleware({ userId: "b", ip: "same" }, response, () => { allowed += 1; });
    limiter.middleware({ userId: "c", ip: "same" }, response, () => { allowed += 1; });
    expect(allowed).toBe(2);
    expect(response.statusCode).toBe(429);
  });
});
