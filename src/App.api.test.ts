// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./App";

describe("authenticated API fetch", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("attaches the stored bearer token to AI requests", async () => {
    localStorage.setItem("io-vault-token", "signed-token");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/api/agent", { method: "POST", body: JSON.stringify({ message: "hello" }) });
    expect(fetchMock).toHaveBeenCalledWith("/api/agent", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer signed-token" }),
    }));
  });
});
