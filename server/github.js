import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { getGithubInstallation } from "./code-db.js";

const API = "https://api.github.com";
export function githubConfigured() {
  return Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY && process.env.GITHUB_APP_SLUG);
}

function appJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) throw new Error("GitHub App is not configured.");
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ iat: now - 30, exp: now + 9 * 60, iss: appId }, privateKey, { algorithm: "RS256" });
}

async function githubFetch(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `GitHub request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getInstallationDetails(installationId) {
  return githubFetch(`/app/installations/${installationId}`, { token: appJwt() });
}

export async function installationToken(userId) {
  const installation = getGithubInstallation(userId);
  if (!installation) throw Object.assign(new Error("Connect GitHub first."), { status: 409 });
  const result = await githubFetch(`/app/installations/${installation.installation_id}/access_tokens`, { token: appJwt(), method: "POST", body: {} });
  return result.token;
}

export async function listInstallationRepositories(userId) {
  const token = await installationToken(userId);
  const result = await githubFetch("/installation/repositories?per_page=100", { token });
  return result.repositories.map((repo) => ({ id: repo.id, fullName: repo.full_name, defaultBranch: repo.default_branch, private: repo.private }));
}

function parseRepository(repository) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || "")) throw Object.assign(new Error("Invalid repository."), { status: 400 });
  return repository;
}

export function validRepositoryPath(path) {
  return typeof path === "string" && path.length > 0 && path.length <= 500 && !path.startsWith("/") && !path.includes("..") && !path.includes("\\") && !/(^|\/)\.env($|\.)/i.test(path);
}

export async function repositoryTree(userId, repository, ref) {
  const token = await installationToken(userId);
  const repo = parseRepository(repository);
  const branch = encodeURIComponent(ref || "HEAD");
  const refData = await githubFetch(`/repos/${repo}/git/ref/heads/${branch}`, { token });
  const commit = await githubFetch(`/repos/${repo}/git/commits/${refData.object.sha}`, { token });
  const tree = await githubFetch(`/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`, { token });
  return { sha: refData.object.sha, truncated: Boolean(tree.truncated), entries: tree.tree.map((item) => ({ path: item.path, type: item.type, sha: item.sha, size: item.size })) };
}

export async function repositoryFile(userId, repository, ref, path) {
  if (!validRepositoryPath(path)) throw Object.assign(new Error("Invalid file path."), { status: 400 });
  const token = await installationToken(userId);
  const repo = parseRepository(repository);
  const result = await githubFetch(`/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`, { token });
  if (result.type !== "file") throw Object.assign(new Error("Path is not a file."), { status: 400 });
  if (result.size > 1024 * 1024) throw Object.assign(new Error("Files larger than 1 MB are not editable in Code Vault."), { status: 413 });
  const content = Buffer.from(result.content || "", "base64").toString("utf8");
  if (content.includes("\u0000")) throw Object.assign(new Error("Binary files are not editable in Code Vault."), { status: 415 });
  return { content, sha: result.sha, size: result.size };
}

function slug(value) {
  return String(value || "change").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "change";
}

export async function publishPatch(userId, patchSet, title, draft = true) {
  const repository = parseRepository(patchSet.repository);
  const token = await installationToken(userId);
  const branchName = `iovault/${slug(title)}-${Date.now().toString(36)}`;
  const baseRef = await githubFetch(`/repos/${repository}/git/ref/heads/${encodeURIComponent(patchSet.baseBranch)}`, { token });
  if (baseRef.object.sha !== patchSet.baseSha) throw Object.assign(new Error("The base branch changed after this patch was generated. Refresh the repository and ask the assistant again."), { status: 409 });
  const baseCommit = await githubFetch(`/repos/${repository}/git/commits/${patchSet.baseSha}`, { token });
  const accepted = patchSet.changes.filter((change) => change.accepted);
  if (!accepted.length) throw Object.assign(new Error("Accept at least one change before publishing."), { status: 400 });
  const treeEntries = [];
  for (const change of accepted) {
    if (!validRepositoryPath(change.path)) throw Object.assign(new Error(`Invalid path: ${change.path}`), { status: 400 });
    if (change.operation === "delete") {
      treeEntries.push({ path: change.path, mode: "100644", type: "blob", sha: null });
    } else {
      const blob = await githubFetch(`/repos/${repository}/git/blobs`, { token, method: "POST", body: { content: change.content || "", encoding: "utf-8" } });
      treeEntries.push({ path: change.path, mode: "100644", type: "blob", sha: blob.sha });
    }
  }
  const tree = await githubFetch(`/repos/${repository}/git/trees`, { token, method: "POST", body: { base_tree: baseCommit.tree.sha, tree: treeEntries } });
  const commit = await githubFetch(`/repos/${repository}/git/commits`, { token, method: "POST", body: { message: title, tree: tree.sha, parents: [patchSet.baseSha] } });
  await githubFetch(`/repos/${repository}/git/refs`, { token, method: "POST", body: { ref: `refs/heads/${branchName}`, sha: commit.sha } });
  const pullRequest = await githubFetch(`/repos/${repository}/pulls`, { token, method: "POST", body: { title, head: branchName, base: patchSet.baseBranch, body: `${patchSet.summary}\n\n${patchSet.explanation}\n\nCreated with IO Vault.`, draft } });
  return { branch: branchName, commitSha: commit.sha, pullRequestUrl: pullRequest.html_url };
}
