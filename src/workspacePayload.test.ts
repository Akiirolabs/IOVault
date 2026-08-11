import { describe, expect, it } from "vitest";
import { MAX_WORKSPACE_UPLOAD_BYTES, serializeWorkspaceUpload } from "./workspacePayload";

describe("workspace upload budget", () => {
  it("allows a UTF-8 serialized payload just below the client budget", () => {
    const payload = serializeWorkspaceUpload({ project: "x".repeat(MAX_WORKSPACE_UPLOAD_BYTES - 40) });
    expect(payload.bytes).toBeLessThanOrEqual(MAX_WORKSPACE_UPLOAD_BYTES);
    expect(payload.withinBudget).toBe(true);
  });

  it("rejects a UTF-8 serialized payload above the client budget", () => {
    const payload = serializeWorkspaceUpload({ project: "😀".repeat(Math.ceil(MAX_WORKSPACE_UPLOAD_BYTES / 4)) });
    expect(payload.bytes).toBeGreaterThan(MAX_WORKSPACE_UPLOAD_BYTES);
    expect(payload.withinBudget).toBe(false);
  });
});
