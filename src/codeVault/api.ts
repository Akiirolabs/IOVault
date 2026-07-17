import type { AssistantAction, CodeFile, PatchSet, RepositorySummary, RepositoryTreeEntry } from "./types";

const tokenKey = "io-vault-token";

async function codeApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data as T;
}

export async function beginGithubConnection() {
  const data = await codeApi<{ installUrl: string }>("/api/code/github/connect", { method: "POST" });
  window.location.assign(data.installUrl);
}

export async function listRepositories() {
  return codeApi<{ configured: boolean; connected: boolean; repositories: RepositorySummary[] }>("/api/code/github/repositories");
}

export async function disconnectGithub() {
  return codeApi<{ ok: boolean }>("/api/code/github/disconnect", { method: "DELETE" });
}

export async function loadRepositoryTree(repository: string, ref: string) {
  const query = new URLSearchParams({ repository, ref });
  return codeApi<{ sha: string; truncated: boolean; entries: RepositoryTreeEntry[] }>(`/api/code/github/tree?${query}`);
}

export async function loadRepositoryFile(repository: string, ref: string, path: string) {
  const query = new URLSearchParams({ repository, ref, path });
  return codeApi<{ content: string; sha: string; size: number }>(`/api/code/github/file?${query}`);
}

export async function listRemoteScratchFiles(workspaceId = "scratch") {
  return codeApi<{ files: Array<{ id: string; workspace_id: string; path: string; language: string; content: string; updated_at: string }> }>(`/api/code/scratch?${new URLSearchParams({ workspaceId })}`);
}

export async function saveRemoteScratchFile(file: CodeFile) {
  return codeApi<{ ok: boolean }>(`/api/code/scratch/${encodeURIComponent(file.id)}`, {
    method: "PUT",
    body: JSON.stringify({ workspaceId: file.workspaceId, path: file.path, language: file.language, content: file.content }),
  });
}

export async function deleteRemoteScratchFile(id: string) {
  return codeApi<{ ok: boolean }>(`/api/code/scratch/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function createManualPatchSet(input: {
  repository: string;
  baseBranch: string;
  baseSha: string;
  summary: string;
  changes: Array<{ operation: "create" | "update" | "delete"; path: string; content: string; rationale: string }>;
}) {
  return codeApi<{ patchSet: PatchSet }>("/api/code/patch-sets", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((result) => result.patchSet);
}

export async function requestCodeAssistance(input: {
  action: AssistantAction;
  prompt: string;
  quality: "balanced" | "best";
  repository?: string;
  baseBranch?: string;
  baseSha?: string;
  files: CodeFile[];
  scratchpad?: string;
}): Promise<PatchSet> {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch("/api/code/assist/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      ...input,
      files: input.files.map(({ path, content, language, sha }) => ({ path, content, language, sha })),
    }),
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Assistant request failed (${response.status}).`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: PatchSet | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine) continue;
      const payload = JSON.parse(dataLine.slice(6));
      if (payload.type === "error") throw new Error(payload.error);
      if (payload.type === "result") result = payload.patchSet;
    }
  }
  if (!result) throw new Error("The assistant did not return a patch set.");
  return result;
}

export async function publishPatchSet(patchSet: PatchSet, title: string) {
  return codeApi<{ branch: string; commitSha: string; pullRequestUrl: string }>("/api/code/publish", {
    method: "POST",
    body: JSON.stringify({ patchSetId: patchSet.id, title, draft: true, acceptedChangeIds: patchSet.changes.filter((change) => change.accepted).map((change) => change.id) }),
  });
}
