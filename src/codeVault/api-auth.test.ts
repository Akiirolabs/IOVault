// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteRemoteScratchFile, listRepositories } from "./api";

describe("Code Vault cookie authentication", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses same-origin credentials and adds CSRF only to mutations", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ configured: false, connected: false, repositories: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await listRepositories();
    await deleteRemoteScratchFile("scratch-one");

    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ credentials: "same-origin" }));
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("X-IOVault-CSRF");
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ credentials: "same-origin" }));
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual(expect.objectContaining({ "X-IOVault-CSRF": "1" }));
  });
});
