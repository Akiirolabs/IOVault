// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, buildAgentContext, buildAgentConversationPrompt, buildSelectedAgentContext, type VaultState } from "./App";
import { createInitialWriteState } from "./notes/model";

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
      projects: { blocks: [{ id: "project-1", title: "Selected project", status: "Active", body: "Only this project", docHtml: "<p>Project document</p>" }] },
      write: createInitialWriteState("<p>private writing</p>"),
      github: { repo: "private/repo" },
      settings: { navIcons: { code: "code", write: "pencil", learning: "cap", career: "briefcase", projects: "folder", settings: "cog" }, theme: { mode: "default", hue: 198, glow: 55, depth: 8 } },
      assistant: { activeConversationId: "chat", conversations: [] },
    } as VaultState;
    const context = buildAgentContext("learning", state);
    const serialized = JSON.stringify(context);
    expect(serialized).toContain("selected learning notes");
    expect(serialized).not.toContain("private code");
    expect(serialized).not.toContain("private resume");
    expect(serialized).not.toContain("private writing");
    expect(serialized).not.toContain("private/repo");
    expect(buildAgentContext("settings", state)).toEqual({ scope: "settings", data: { theme: { mode: "default", hue: 198, glow: 55, depth: 8 } } });
    expect(buildSelectedAgentContext(["learning", "settings", "learning"], state)).toEqual({
      scope: "selected",
      data: { pages: [buildAgentContext("learning", state), buildAgentContext("settings", state)] },
    });
    expect(buildSelectedAgentContext([], state)).toBeUndefined();
    expect(buildSelectedAgentContext([], state, ["project-1"])).toEqual({ scope: "projects", data: { project: {
      id: "project-1", title: "Selected project", status: "Active", body: "Only this project", document: "Project document", markdown: "",
    } } });
  });

  it("includes bounded visible conversation history in follow-up requests", () => {
    const prompt = buildAgentConversationPrompt([
      { id: "1", role: "user", content: "Plan the page", createdAt: "2026-07-30" },
      { id: "2", role: "assistant", content: "Start with the layout.", createdAt: "2026-07-30" },
    ], "What comes next?");
    expect(prompt).toContain("User: Plan the page");
    expect(prompt).toContain("Assistant: Start with the layout.");
    expect(prompt).toContain("User: What comes next?");
    expect(prompt.length).toBeLessThanOrEqual(8_000);
  });
});
