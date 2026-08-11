const LEGACY_WORKSPACE_KEY = "io-vault-workspace";
const LEGACY_MIGRATION_KEY = "io-vault-workspace-legacy-migration-v1";
const USER_WORKSPACE_PREFIX = "io-vault-workspace:user:";

export type WorkspaceCacheSync = {
  dirty: boolean;
  localOnly: boolean;
  revision: number;
  updatedAt: string;
  lastServerUpdatedAt: string | null;
};

export type WorkspaceCacheRecord = { state: unknown; sync: WorkspaceCacheSync };

const cleanSync = (): WorkspaceCacheSync => ({
  dirty: false,
  localOnly: false,
  revision: 0,
  updatedAt: new Date(0).toISOString(),
  lastServerUpdatedAt: null,
});

export function userWorkspaceKey(userId: string) {
  return `${USER_WORKSPACE_PREFIX}${encodeURIComponent(userId)}`;
}

export function readUserWorkspaceCacheRecord(userId: string): WorkspaceCacheRecord | null {
  const key = userWorkspaceKey(userId);
  const saved = localStorage.getItem(key);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as unknown;
    if (parsed && typeof parsed === "object" && (parsed as { version?: unknown }).version === 1 && "state" in parsed && "sync" in parsed) {
      const envelope = parsed as { state: unknown; sync: Partial<WorkspaceCacheSync> };
      return {
        state: envelope.state,
        sync: {
          dirty: envelope.sync?.dirty === true,
          localOnly: envelope.sync?.localOnly === true,
          revision: Number.isFinite(envelope.sync?.revision) ? Math.max(0, Number(envelope.sync.revision)) : 0,
          updatedAt: typeof envelope.sync?.updatedAt === "string" ? envelope.sync.updatedAt : new Date(0).toISOString(),
          lastServerUpdatedAt: typeof envelope.sync?.lastServerUpdatedAt === "string" ? envelope.sync.lastServerUpdatedAt : null,
        },
      };
    }
    // Backward compatibility: existing per-user entries stored the raw VaultState.
    return { state: parsed, sync: cleanSync() };
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function readUserWorkspaceCache(userId: string): unknown | null {
  return readUserWorkspaceCacheRecord(userId)?.state ?? null;
}

export function writeUserWorkspaceCache(userId: string, state: unknown, sync: WorkspaceCacheSync = cleanSync()) {
  try {
    localStorage.setItem(userWorkspaceKey(userId), JSON.stringify({ version: 1, state, sync }));
    return true;
  } catch {
    return false;
  }
}

export function removeUserWorkspaceCache(userId: string) {
  localStorage.removeItem(userWorkspaceKey(userId));
}

export function hasUnclaimedLegacyWorkspace() {
  return !localStorage.getItem(LEGACY_MIGRATION_KEY) && Boolean(localStorage.getItem(LEGACY_WORKSPACE_KEY));
}

/** Transfers the old anonymous cache only after the signed-in user explicitly confirms ownership. */
export function claimLegacyWorkspace(userId: string, confirmed: boolean): unknown | null {
  if (localStorage.getItem(LEGACY_MIGRATION_KEY)) return null;
  const saved = localStorage.getItem(LEGACY_WORKSPACE_KEY);
  if (!saved) return null;

  localStorage.setItem(LEGACY_MIGRATION_KEY, confirmed ? userId : "declined");
  if (!confirmed) {
    localStorage.removeItem(LEGACY_WORKSPACE_KEY);
    return null;
  }
  localStorage.removeItem(LEGACY_WORKSPACE_KEY);
  try {
    const parsed = JSON.parse(saved) as unknown;
    writeUserWorkspaceCache(userId, parsed, {
      dirty: true,
      localOnly: false,
      revision: 1,
      updatedAt: new Date().toISOString(),
      lastServerUpdatedAt: null,
    });
    return parsed;
  } catch {
    removeUserWorkspaceCache(userId);
    return null;
  }
}

export { LEGACY_MIGRATION_KEY, LEGACY_WORKSPACE_KEY };
