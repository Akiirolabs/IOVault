// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimLegacyWorkspace,
  LEGACY_MIGRATION_KEY,
  LEGACY_WORKSPACE_KEY,
  readUserWorkspaceCache,
  readUserWorkspaceCacheRecord,
  removeUserWorkspaceCache,
  userWorkspaceKey,
  writeUserWorkspaceCache,
} from "./vaultCache";

describe("user-scoped workspace cache", () => {
  beforeEach(() => localStorage.clear());

  it("never exposes user A's cache to user B after an expired or cleared session", () => {
    writeUserWorkspaceCache("user-a", { privateOwner: "A" });
    expect(readUserWorkspaceCache("user-b")).toBeNull();
    writeUserWorkspaceCache("user-b", { privateOwner: "B" });
    expect(readUserWorkspaceCache("user-a")).toEqual({ privateOwner: "A" });
    expect(readUserWorkspaceCache("user-b")).toEqual({ privateOwner: "B" });
  });

  it("removes only the authenticated user's cache on intentional logout", () => {
    writeUserWorkspaceCache("user-a", { privateOwner: "A" });
    writeUserWorkspaceCache("user-b", { privateOwner: "B" });
    removeUserWorkspaceCache("user-a");
    expect(readUserWorkspaceCache("user-a")).toBeNull();
    expect(readUserWorkspaceCache("user-b")).toEqual({ privateOwner: "B" });
  });

  it("supports fetch-failure fallback only from the resolved user's key", () => {
    localStorage.setItem(userWorkspaceKey("user-a"), JSON.stringify({ privateOwner: "A" }));
    expect(readUserWorkspaceCache("user-b")).toBeNull();
  });

  it("reads existing raw caches as clean and persists sync metadata in the new envelope", () => {
    localStorage.setItem(userWorkspaceKey("legacy-user"), JSON.stringify({ raw: true }));
    expect(readUserWorkspaceCacheRecord("legacy-user")).toMatchObject({
      state: { raw: true },
      sync: { dirty: false, localOnly: false, revision: 0, lastServerUpdatedAt: null },
    });

    writeUserWorkspaceCache("user-a", { current: true }, {
      dirty: true,
      localOnly: true,
      revision: 7,
      updatedAt: "2026-08-11T00:00:00.000Z",
      lastServerUpdatedAt: "2026-08-10T00:00:00.000Z",
    });
    expect(readUserWorkspaceCacheRecord("user-a")).toEqual({
      state: { current: true },
      sync: {
        dirty: true,
        localOnly: true,
        revision: 7,
        updatedAt: "2026-08-11T00:00:00.000Z",
        lastServerUpdatedAt: "2026-08-10T00:00:00.000Z",
      },
    });
  });

  it("reports browser quota failures without throwing or claiming a cache write", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(writeUserWorkspaceCache("user-a", { large: true })).toBe(false);
    expect(setItem).toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("records a rejected legacy migration once without exposing it to another user", () => {
    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify({ legacy: true }));
    expect(claimLegacyWorkspace("user-a", false)).toBeNull();
    expect(localStorage.getItem(LEGACY_WORKSPACE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_MIGRATION_KEY)).toBe("declined");
    expect(claimLegacyWorkspace("user-b", true)).toBeNull();
    expect(readUserWorkspaceCache("user-b")).toBeNull();
  });

  it("migrates a confirmed legacy anonymous cache exactly once", () => {
    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify({ legacy: true }));
    expect(claimLegacyWorkspace("user-a", true)).toEqual({ legacy: true });
    expect(localStorage.getItem(LEGACY_WORKSPACE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_MIGRATION_KEY)).toBe("user-a");
    expect(readUserWorkspaceCache("user-a")).toEqual({ legacy: true });

    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify({ wrongOwner: "B" }));
    expect(claimLegacyWorkspace("user-b", true)).toBeNull();
    expect(readUserWorkspaceCache("user-b")).toBeNull();
  });
});
