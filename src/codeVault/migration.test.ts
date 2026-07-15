import { describe, expect, it, vi } from "vitest";
import { migrateLegacyEditor } from "./migration";

describe("legacy Code Vault migration", () => {
  it("preserves editor content and maps TSX to Monaco TypeScript", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "legacy-id" });
    expect(migrateLegacyEditor({ language: "tsx", editor: "export function Card() {}" })).toMatchObject({
      id: "scratch:legacy-id",
      path: "Untitled.tsx",
      language: "typescript",
      content: "export function Card() {}",
      originalContent: "export function Card() {}",
      dirty: false,
    });
    vi.unstubAllGlobals();
  });
});
