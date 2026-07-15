import { beforeEach, describe, expect, it } from "vitest";
import { deleteCodeFile, listWorkspaceFiles, saveCodeFile } from "./storage";
import type { CodeFile } from "./types";

describe("Code Vault IndexedDB cache", () => {
  const file: CodeFile = { id: "scratch:test", workspaceId: "scratch", path: "test.ts", language: "typescript", content: "const ok = true;", originalContent: "const ok = true;", source: "scratch", dirty: false, selectedContext: true, lastOpenedAt: 1 };
  beforeEach(async () => { await deleteCodeFile(file.id); });
  it("persists and lists files by workspace", async () => {
    await saveCodeFile(file);
    await expect(listWorkspaceFiles("scratch")).resolves.toEqual([file]);
  });
});
