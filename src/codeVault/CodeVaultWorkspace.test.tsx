import { fireEvent, render, screen } from "@testing-library/react";
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
    const updateCode = vi.fn();
    render(<CodeVaultWorkspace code={{ language: "tsx", editor: "const value = 1", notesHtml: "<p>notes</p>", snippets: [{ id: "one", title: "Example", language: "ts", code: "const value = 1" }] }} githubSuggestion="" updateCode={updateCode} />);
    expect(screen.getByRole("button", { name: /Files/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Snippets 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assistant" })).toBeInTheDocument();
    expect(await screen.findByTestId("monaco-editor")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "File name" })).toHaveValue("Untitled.tsx");
    fireEvent.click(screen.getByRole("button", { name: /Snippets 1/i }));
    const filename = screen.getByRole("textbox", { name: "Snippet filename Example" });
    expect(filename).toHaveValue("Example.ts");
    fireEvent.change(filename, { target: { value: "helper.py" } });
    fireEvent.blur(filename);
    expect(updateCode).toHaveBeenCalledWith(expect.objectContaining({ snippets: [expect.objectContaining({ title: "helper.py", language: "python" })] }));
  });
});
