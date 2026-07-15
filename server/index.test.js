// @vitest-environment node
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app;
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  ({ app } = await import("./index.js"));
});

describe("Code Vault API authentication", () => {
  it("protects repository and scratch endpoints", async () => {
    await request(app).get("/api/code/github/repositories").expect(401);
    const result = await request(app).get("/api/code/scratch").expect(401);
    expect(result.body.error).toBe("Not authenticated.");
  });
});
