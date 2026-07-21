// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, buildAgentContext, type VaultState } from "./App";

describe("authenticated API fetch", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("uses same-origin cookies and CSRF protection without exposing a bearer token", async () => {
    localStorage.setItem("io-vault-token", "legacy-token");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/api/agent", { method: "POST", body: JSON.stringify({ message: "hello" }) });
    expect(fetchMock).toHaveBeenCalledWith("/api/agent", expect.objectContaining({
      credentials: "same-origin",
      headers: expect.objectContaining({ "X-IOVault-CSRF": "1" }),
    }));
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.headers).not.toHaveProperty("Authorization");
  });

  it("builds context only from the explicitly selected page", () => {
    const state = {
      code: { language: "tsx", editor: "private code", notesHtml: "<p>notes</p>", snippets: [] },
      learning: { docHtml: "<p>selected learning notes</p>", connections: [], calendarFocus: [] },
      career: { resume: "private resume", aiDraft: "private draft" },
      projects: { blocks: [] },
      write: { docHtml: "<p>private writing</p>" },
      github: { repo: "private/repo" },
      settings: { navIcons: { code: "code", write: "pencil", learning: "cap", career: "briefcase", projects: "folder" } },
    } as VaultState;
    const context = buildAgentContext("learning", state);
    const serialized = JSON.stringify(context);
    expect(serialized).toContain("selected learning notes");
    expect(serialized).not.toContain("private code");
    expect(serialized).not.toContain("private resume");
    expect(serialized).not.toContain("private writing");
    expect(serialized).not.toContain("private/repo");
  });
});
