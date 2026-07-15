import type { CodeFile } from "./types";

export function languageFromLegacy(value: string) {
  return ({ tsx: "typescript", ts: "typescript", jsx: "javascript", js: "javascript", py: "python", css: "css" } as Record<string, string>)[value] || "plaintext";
}

export function migrateLegacyEditor(code: { language: string; editor: string }): CodeFile {
  const extension = code.language === "tsx" ? "tsx" : code.language || "txt";
  return {
    id: `scratch:${crypto.randomUUID()}`,
    workspaceId: "scratch",
    path: `Untitled.${extension}`,
    language: languageFromLegacy(extension),
    content: code.editor,
    originalContent: code.editor,
    source: "scratch",
    dirty: false,
    selectedContext: true,
    lastOpenedAt: Date.now(),
  };
}
