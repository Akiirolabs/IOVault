import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CodeVaultWorkspace from "./CodeVaultWorkspace";

vi.mock("@monaco-editor/react", () => ({ default: () => <div data-testid="monaco-editor" /> }));
vi.mock("./api", () => ({
  listRepositories: vi.fn(async () => ({ configured: false, connected: false, repositories: [] })),
  listRemoteScratchFiles: vi.fn(async () => ({ files: [] })),
  saveRemoteScratchFile: vi.fn(async () => ({ ok: true })),
  deleteRemoteScratchFile: vi.fn(async () => ({ ok: true })),
  beginGithubConnection: vi.fn(), disconnectGithub: vi.fn(), loadRepositoryFile: vi.fn(), loadRepositoryTree: vi.fn(), publishPatchSet: vi.fn(), requestCodeAssistance: vi.fn(),
}));

describe("Code Vault workspace", () => {
  it("renders Explorer, editor, Assistant, and preserved snippets", async () => {
    render(<CodeVaultWorkspace code={{ language: "tsx", editor: "const value = 1", notesHtml: "<p>notes</p>", snippets: [{ id: "one", title: "Example", language: "ts", code: "const value = 1" }] }} githubSuggestion="" updateCode={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Files/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Snippets 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assistant" })).toBeInTheDocument();
    expect(await screen.findByTestId("monaco-editor")).toBeInTheDocument();
  });
});
