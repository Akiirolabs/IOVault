// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { readUserWorkspaceCacheRecord, userWorkspaceKey, writeUserWorkspaceCache } from "./vaultCache";
import { MAX_WORKSPACE_UPLOAD_BYTES } from "./workspacePayload";

const user = { id: "auth-persistence-user", email: "owner@example.com" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});
const serverWorkspace = {
  settings: { theme: { mode: "light", hue: 120, glow: 42, depth: 4 } },
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("authenticated workspace persistence", () => {
  it("keeps the authenticated shell gated until the active user's delayed workspace resolves", async () => {
    let resolveWorkspace!: (response: Response) => void;
    const workspaceResponse = new Promise<Response>((resolve) => { resolveWorkspace = resolve; });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault") return workspaceResponse;
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/vault", expect.anything()));
    expect(screen.getByRole("heading", { name: "Loading…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlock" })).not.toBeInTheDocument();

    await act(async () => resolveWorkspace(jsonResponse({ data: serverWorkspace })));
    const unlock = await screen.findByRole("button", { name: "Unlock" });
    expect(unlock.closest("main")).toHaveClass("theme-light");
  });

  it("does not let a stale superseded workspace publish or clear the newer user's loading gate", async () => {
    const userA = { id: "superseded-a", email: "a@example.com" };
    const userB = { id: "active-b", email: "b@example.com" };
    let resolveAuthA!: (response: Response) => void;
    let resolveAuthB!: (response: Response) => void;
    let resolveVaultA!: (response: Response) => void;
    let resolveVaultB!: (response: Response) => void;
    const authResponses = [
      new Promise<Response>((resolve) => { resolveAuthA = resolve; }),
      new Promise<Response>((resolve) => { resolveAuthB = resolve; }),
    ];
    const vaultResponses = [
      new Promise<Response>((resolve) => { resolveVaultA = resolve; }),
      new Promise<Response>((resolve) => { resolveVaultB = resolve; }),
    ];
    let authIndex = 0;
    let vaultIndex = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ error: "Not authenticated" }, 401));
      if (url === "/api/auth/login") return authResponses[authIndex++];
      if (url === "/api/vault") return vaultResponses[vaultIndex++];
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const email = await screen.findByRole("textbox", { name: "Email" });
    const password = screen.getByLabelText("Password");
    fireEvent.change(email, { target: { value: "owner@example.com" } });
    fireEvent.change(password, { target: { value: "secure-password" } });
    const form = email.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    await act(async () => resolveAuthA(jsonResponse({ user: userA })));
    await waitFor(() => expect(vaultIndex).toBe(1));
    await act(async () => resolveAuthB(jsonResponse({ user: userB })));
    await waitFor(() => expect(vaultIndex).toBe(2));
    await act(async () => resolveVaultA(jsonResponse({ data: { settings: { theme: { mode: "light" } } } })));
    expect(screen.getByRole("heading", { name: "Loading…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlock" })).not.toBeInTheDocument();

    await act(async () => resolveVaultB(jsonResponse({ data: { settings: { theme: { mode: "night" } } } })));
    const unlock = await screen.findByRole("button", { name: "Unlock" });
    expect(unlock.closest("main")).toHaveClass("theme-night");
    expect(screen.getByRole("button", { name: `Sign out (${userB.email})` })).toBeInTheDocument();
  });

  it("flushes the latest complete state before logout and clears only that user's cache after acknowledgment", async () => {
    let resolvePutA!: (response: Response) => void;
    let resolvePutB!: (response: Response) => void;
    let resolveLogout!: (response: Response) => void;
    const putResponses = [
      new Promise<Response>((resolve) => { resolvePutA = resolve; }),
      new Promise<Response>((resolve) => { resolvePutB = resolve; }),
    ];
    let putIndex = 0;
    const logoutResponse = new Promise<Response>((resolve) => { resolveLogout = resolve; });
    const requestOrder: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      requestOrder.push(`${method} ${url}`);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault" && method === "GET") return Promise.resolve(jsonResponse({ data: serverWorkspace }));
      if (url === "/api/vault" && method === "PUT") return putResponses[putIndex++];
      if (url === "/api/auth/logout") return logoutResponse;
      throw new Error(`Unexpected request: ${method} ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Unlock" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    vi.useFakeTimers();
    fireEvent.change(screen.getByRole("slider", { name: "Theme accent shade" }), { target: { value: "200" } });
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(putIndex).toBe(1);
    const firstPut = fetchMock.mock.calls.find(([input, init]) => String(input) === "/api/vault" && init?.method === "PUT");
    expect(JSON.parse(String(firstPut?.[1]?.body)).data.settings.theme.hue).toBe(200);

    fireEvent.change(screen.getByRole("slider", { name: "Theme accent shade" }), { target: { value: "250" } });
    expect(localStorage.getItem(userWorkspaceKey(user.id))).toContain('"hue":250');
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await act(async () => {});
    expect(putIndex).toBe(1);
    expect(requestOrder).not.toContain("POST /api/auth/logout");
    expect(localStorage.getItem(userWorkspaceKey(user.id))).not.toBeNull();

    await act(async () => resolvePutA(jsonResponse({ error: "older save failed" }, 500)));
    expect(putIndex).toBe(2);
    expect(screen.getByTitle("Server sync status")).toHaveTextContent("Saving…");
    const putCalls = fetchMock.mock.calls.filter(([input, init]) => String(input) === "/api/vault" && init?.method === "PUT");
    expect(JSON.parse(String(putCalls[1]?.[1]?.body)).data.settings.theme.hue).toBe(250);
    expect(requestOrder).not.toContain("POST /api/auth/logout");

    await act(async () => resolvePutB(jsonResponse({ ok: true })));
    expect(readUserWorkspaceCacheRecord(user.id)?.sync).toMatchObject({ dirty: false, localOnly: false, revision: 2 });
    expect(requestOrder[requestOrder.length - 1]).toBe("POST /api/auth/logout");
    await act(async () => resolveLogout(jsonResponse({ ok: true })));
    vi.useRealTimers();
    expect(requestOrder.slice(-2)).toEqual(["PUT /api/vault", "POST /api/auth/logout"]);
    expect(localStorage.getItem(userWorkspaceKey(user.id))).toBeNull();
    expect(await screen.findByText("Sign in to your vault")).toBeInTheDocument();
  });

  it("does not logout, clear the cache, or reset the UI when the final save fails", async () => {
    const requestOrder: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      requestOrder.push(`${method} ${url}`);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault" && method === "GET") return Promise.resolve(jsonResponse({ data: serverWorkspace }));
      if (url === "/api/vault" && method === "PUT") return Promise.resolve(jsonResponse({ error: "save failed" }, 500));
      if (url === "/api/auth/logout") return Promise.resolve(jsonResponse({ ok: true }));
      throw new Error(`Unexpected request: ${method} ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const unlock = await screen.findByRole("button", { name: "Unlock" });
    expect(localStorage.getItem(userWorkspaceKey(user.id))).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: `Sign out (${user.email})` }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save changes. Retry sign out.");
    expect(screen.getByRole("button", { name: "Unlock" })).toBe(unlock);
    expect(requestOrder).not.toContain("POST /api/auth/logout");
    expect(localStorage.getItem(userWorkspaceKey(user.id))).not.toBeNull();
  });

  it("keeps an oversized Projects workspace local and blocks false cloud-save logout", async () => {
    const oversizedWorkspace = {
      projects: { blocks: [{ id: "large-project", title: "Large", status: "Active", body: "x".repeat(MAX_WORKSPACE_UPLOAD_BYTES + 1_000) }] },
    };
    const requestOrder: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      requestOrder.push(`${method} ${url}`);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault" && method === "GET") return Promise.resolve(jsonResponse({ data: oversizedWorkspace }));
      if (url === "/api/vault" && method === "PUT") return Promise.resolve(jsonResponse({ ok: true }));
      if (url === "/api/auth/logout") return Promise.resolve(jsonResponse({ ok: true }));
      throw new Error(`Unexpected request: ${method} ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Unlock" }));
    expect(localStorage.getItem(userWorkspaceKey(user.id))).toContain("large-project");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Workspace is too large for cloud sync. Your work remains saved in this browser. Reduce unneeded Projects content, then retry.")).toHaveAttribute("role", "alert");
    expect(requestOrder).not.toContain("PUT /api/vault");
    expect(requestOrder).not.toContain("POST /api/auth/logout");
    expect(localStorage.getItem(userWorkspaceKey(user.id))).toContain("large-project");
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it("shows browser cache quota failures without crashing or claiming the workspace is saved", async () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(this: Storage, key, value) {
      if (String(key).startsWith("io-vault-workspace:user:")) throw new DOMException("Quota exceeded", "QuotaExceededError");
      return originalSetItem.call(this, key, value);
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault") return Promise.resolve(jsonResponse({ data: serverWorkspace }));
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Browser storage failed. Manually copy important content, free browser storage without clearing IO Vault site data, then retry.");
    expect(screen.getByRole("button", { name: "Unlock" })).toBeInTheDocument();
    expect(screen.queryByText("Saved to cloud")).not.toBeInTheDocument();
  });

  it("prioritizes cache failure when an oversized workspace also cannot be saved in the browser", async () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(this: Storage, key, value) {
      if (String(key).startsWith("io-vault-workspace:user:")) throw new DOMException("Quota exceeded", "QuotaExceededError");
      return originalSetItem.call(this, key, value);
    });
    const oversizedWorkspace = {
      projects: { blocks: [{ id: "uncached-large", title: "Uncached Large", status: "Active", body: "x".repeat(MAX_WORKSPACE_UPLOAD_BYTES + 1_000) }] },
    };
    const requestOrder: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      requestOrder.push(`${method} ${url}`);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault" && method === "GET") return Promise.resolve(jsonResponse({ data: oversizedWorkspace }));
      if (url === "/api/code/github/repositories") return Promise.resolve(jsonResponse({ repositories: [] }));
      if (url === "/api/code/scratch") return Promise.resolve(jsonResponse({ files: [] }));
      throw new Error(`Unexpected request: ${method} ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Unlock" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Browser storage failed. Manually copy important content, free browser storage without clearing IO Vault site data, then retry.")).toHaveAttribute("role", "alert");
    expect(screen.queryByText(/Your work remains saved in this browser/)).not.toBeInTheDocument();
    expect(requestOrder).not.toContain("PUT /api/vault");
    expect(requestOrder).not.toContain("POST /api/auth/logout");
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it("restores a newer oversized local Project after remount instead of replacing it with older server data", async () => {
    const oldServerWorkspace = {
      projects: { blocks: [{ id: "project-1", title: "Old Cloud Project", status: "Active", body: "Old cloud body", docHtml: "" }] },
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault") return Promise.resolve(jsonResponse({ data: oldServerWorkspace, updatedAt: "2026-08-10T00:00:00.000Z" }));
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Unlock" }));
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Old Cloud Project as a full page" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Project title" }), { target: { value: "Newer Local Project" } });
    const editor = screen.getByRole("textbox", { name: "Project rich text document" });
    editor.innerHTML = `<p>${"x".repeat(MAX_WORKSPACE_UPLOAD_BYTES + 1_000)}</p>`;
    fireEvent.input(editor);
    expect(screen.getByTitle("Server sync status")).toHaveTextContent("Local only — too large");
    first.unmount();

    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Workspace is too large for cloud sync. It remains local only.");
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("textbox", { name: "Newer Local Project title" })).toHaveValue("Newer Local Project");
    expect(screen.queryByRole("textbox", { name: "Old Cloud Project title" })).not.toBeInTheDocument();
  });

  it("lets newer server data replace a clean acknowledged cache", async () => {
    writeUserWorkspaceCache(user.id, {
      projects: { blocks: [{ id: "project-1", title: "Clean Cached Project", status: "Active", body: "cached" }] },
    }, {
      dirty: false,
      localOnly: false,
      revision: 4,
      updatedAt: "2026-08-10T00:00:00.000Z",
      lastServerUpdatedAt: "2026-08-10T00:00:00.000Z",
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault") return Promise.resolve(jsonResponse({
        data: { projects: { blocks: [{ id: "project-1", title: "New Server Project", status: "Active", body: "server" }] } },
        updatedAt: "2026-08-11T00:00:00.000Z",
      }));
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Unlock" }));
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("textbox", { name: "New Server Project title" })).toHaveValue("New Server Project");
    expect(screen.queryByRole("textbox", { name: "Clean Cached Project title" })).not.toBeInTheDocument();
  });

  it("keeps compact and full-page rich text and Markdown edits synchronized", async () => {
    const workspace = { projects: { blocks: [{ id: "project-1", title: "Shared Project", status: "Active", body: "", docHtml: "<p>Start</p>", docMarkdown: "Start" }] } };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse({ user }));
      if (url === "/api/vault" && (!init?.method || init.method === "GET")) return Promise.resolve(jsonResponse({ data: workspace }));
      if (url === "/api/vault" && init?.method === "PUT") return Promise.resolve(jsonResponse({ ok: true }));
      throw new Error(`Unexpected request: ${url}`);
    }));

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Unlock" }));
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    const compactRich = screen.getByRole("textbox", { name: "Shared Project document editor" });
    compactRich.innerHTML = "<p>Compact edit</p>";
    fireEvent.input(compactRich);
    fireEvent.click(screen.getByRole("button", { name: "Open Shared Project as a full page" }));
    expect(screen.queryByRole("textbox", { name: "Shared Project document editor" })).not.toBeInTheDocument();
    const fullRich = screen.getByRole("textbox", { name: "Project rich text document" });
    expect(fullRich.innerHTML).toBe("<p>Compact edit</p>");
    fullRich.innerHTML = "<p>Full edit</p>";
    fireEvent.input(fullRich);
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Project markdown" }), { target: { value: "Full markdown" } });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("textbox", { name: "Shared Project document editor" }).innerHTML).toBe("<p>Full edit</p>");
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    expect(screen.getByRole("textbox", { name: "Shared Project markdown editor" })).toHaveValue("Full markdown");
    fireEvent.change(screen.getByRole("textbox", { name: "Shared Project markdown editor" }), { target: { value: "Compact markdown" } });
    fireEvent.click(screen.getByRole("button", { name: "Open Shared Project as a full page" }));
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    expect(screen.getByRole("textbox", { name: "Project markdown" })).toHaveValue("Compact markdown");
  });
});
