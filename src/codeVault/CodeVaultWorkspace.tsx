import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { BeforeMount } from "@monaco-editor/react";
import type { CodeSnippet } from "./types";
import type { AssistantAction, CodeFile, PatchSet, RepositorySummary, RepositoryTreeEntry } from "./types";
import { beginGithubConnection, createManualPatchSet, deleteRemoteScratchFile, disconnectGithub, listRemoteScratchFiles, listRepositories, loadRepositoryFile, loadRepositoryTree, publishPatchSet, requestCodeAssistance, saveRemoteScratchFile } from "./api";
import { deleteCodeFile, listWorkspaceFiles, saveCodeFile } from "./storage";
import { migrateLegacyEditor } from "./migration";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const configureMonaco: BeforeMount = (monaco) => {
  const diagnostics = {
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  };
  const compilerOptions = {
    allowNonTsExtensions: true,
    allowJs: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    target: monaco.languages.typescript.ScriptTarget.ES2022,
  };

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnostics);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnostics);
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
};

type CodeState = {
  language: string;
  editor: string;
  notesHtml: string;
  snippets: CodeSnippet[];
};

type Props = {
  code: CodeState;
  githubSuggestion: string;
  updateCode: (updates: Partial<CodeState>) => void;
};

const actionLabels: Array<{ value: AssistantAction; label: string }> = [
  { value: "ask", label: "Ask" },
  { value: "explain", label: "Explain" },
  { value: "review", label: "Review" },
  { value: "fix", label: "Fix" },
  { value: "refactor", label: "Refactor" },
  { value: "tests", label: "Generate tests" },
  { value: "document", label: "Document" },
];

const ignoredPath = /(^|\/)(node_modules|dist|build|coverage|\.git|\.next|vendor)(\/|$)|(^|\/)(\.env|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i;

function languageFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({ tsx: "typescript", ts: "typescript", jsx: "javascript", js: "javascript", mjs: "javascript", py: "python", css: "css", html: "html", json: "json", md: "markdown", yml: "yaml", yaml: "yaml", sh: "shell" } as Record<string, string>)[extension || ""] || "plaintext";
}

function snippetExtension(language: string) {
  return ({ typescript: "ts", ts: "ts", tsx: "tsx", javascript: "js", js: "js", jsx: "jsx", python: "py", py: "py", css: "css", html: "html", json: "json", markdown: "md", yaml: "yml", shell: "sh" } as Record<string, string>)[language.toLowerCase()] || "txt";
}

function snippetFilename(snippet: CodeSnippet) {
  return /\.[A-Za-z0-9]+$/.test(snippet.title) ? snippet.title : `${snippet.title}.${snippetExtension(snippet.language)}`;
}

function snippetLanguage(snippet: CodeSnippet, filename = snippetFilename(snippet)) {
  const detected = languageFromPath(filename);
  return detected === "plaintext" ? languageFromPath(`file.${snippetExtension(snippet.language)}`) : detected;
}

function basename(path: string) {
  return path.split("/").pop() || path;
}

function monacoModelPath(file: CodeFile) {
  const safePath = file.path.split("/").map(encodeURIComponent).join("/");
  return `inmemory://iovault/${encodeURIComponent(file.workspaceId)}/${encodeURIComponent(file.id)}/${safePath}`;
}

function stripHtml(value: string) {
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || "";
}

export default function CodeVaultWorkspace({ code, githubSuggestion, updateCode }: Props) {
  const [explorerTab, setExplorerTab] = useState<"files" | "snippets">("files");
  const [rightTab, setRightTab] = useState<"assistant" | "changes">("assistant");
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<RepositorySummary[]>([]);
  const [githubConfigured, setGithubConfigured] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [repository, setRepository] = useState("");
  const [baseBranch, setBaseBranch] = useState("");
  const [baseSha, setBaseSha] = useState("");
  const [tree, setTree] = useState<RepositoryTreeEntry[]>([]);
  const [action, setAction] = useState<AssistantAction>("ask");
  const [quality, setQuality] = useState<"balanced" | "best">("balanced");
  const [prompt, setPrompt] = useState("");
  const [includeScratchpad, setIncludeScratchpad] = useState(false);
  const [patchSet, setPatchSet] = useState<PatchSet | null>(null);
  const [assistantStatus, setAssistantStatus] = useState("Select context files and describe the change you want.");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<CodeFile[] | null>(null);
  const [snippetNameDrafts, setSnippetNameDrafts] = useState<Record<string, string>>({});
  const [fileNameDraft, setFileNameDraft] = useState<string | null>(null);

  const activeFile = files.find((file) => file.id === activeFileId) || null;
  const contextFiles = files.filter((file) => file.selectedContext);
  const visibleTree = useMemo(() => tree.filter((entry) => entry.type === "blob" && !ignoredPath.test(entry.path) && (entry.size ?? 0) <= 1024 * 1024).slice(0, 600), [tree]);

  useEffect(() => {
    void Promise.all([listWorkspaceFiles("scratch"), listRemoteScratchFiles().catch(() => ({ files: [] }))]).then(async ([saved, remote]) => {
      const remoteFiles: CodeFile[] = remote.files.map((file) => ({ id: file.id, workspaceId: file.workspace_id, path: file.path, language: file.language, content: file.content, originalContent: file.content, source: "scratch", dirty: false, selectedContext: true, lastOpenedAt: new Date(file.updated_at).getTime() || Date.now() }));
      const mergedByPath = new Map(remoteFiles.map((file) => [file.path, file]));
      for (const local of saved) {
        if (!mergedByPath.has(local.path)) {
          mergedByPath.set(local.path, local);
          await saveRemoteScratchFile(local).catch(() => ({ ok: false }));
        }
      }
      const merged = [...mergedByPath.values()].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
      if (merged.length) {
        for (const file of merged) await saveCodeFile(file);
        setFiles(merged);
        setActiveFileId(merged[0].id);
        return;
      }
      const legacyFile = migrateLegacyEditor(code);
      await Promise.all([saveCodeFile(legacyFile), saveRemoteScratchFile(legacyFile).catch(() => ({ ok: false }))]);
      setFiles([legacyFile]);
      setActiveFileId(legacyFile.id);
    });
    void refreshRepositories();
    // The legacy editor is intentionally read once for migration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshRepositories() {
    try {
      const data = await listRepositories();
      setGithubConfigured(data.configured);
      setGithubConnected(data.connected);
      setRepositories(data.repositories);
      if (!repository && githubSuggestion) {
        const suggested = data.repositories.find((item) => item.fullName.toLowerCase() === githubSuggestion.toLowerCase());
        if (suggested) await chooseRepository(suggested);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load GitHub repositories.");
    }
  }

  async function chooseRepository(repo: RepositorySummary) {
    setIsBusy(true);
    setError(null);
    try {
      const result = await loadRepositoryTree(repo.fullName, repo.defaultBranch);
      const cached = await listWorkspaceFiles(`github:${repo.fullName}`);
      setRepository(repo.fullName);
      setBaseBranch(repo.defaultBranch);
      setBaseSha(result.sha);
      setTree(result.entries);
      setFiles(cached);
      setActiveFileId(cached[0]?.id || null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open repository.");
    } finally {
      setIsBusy(false);
    }
  }

  async function openTreeFile(entry: RepositoryTreeEntry) {
    const existing = files.find((file) => file.repository === repository && file.path === entry.path);
    if (existing) {
      setActiveFileId(existing.id);
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await loadRepositoryFile(repository, baseBranch, entry.path);
      const file: CodeFile = {
        id: `github:${repository}:${entry.path}`,
        workspaceId: `github:${repository}`,
        path: entry.path,
        language: languageFromPath(entry.path),
        content: result.content,
        originalContent: result.content,
        source: "github",
        repository,
        ref: baseBranch,
        sha: result.sha,
        dirty: false,
        selectedContext: true,
        lastOpenedAt: Date.now(),
      };
      await saveCodeFile(file);
      setFiles((current) => [...current, file]);
      setActiveFileId(file.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open file.");
    } finally {
      setIsBusy(false);
    }
  }

  function updateFile(id: string, updates: Partial<CodeFile>) {
    setFiles((current) => current.map((file) => {
      if (file.id !== id) return file;
      const next = { ...file, ...updates, lastOpenedAt: Date.now() };
      void saveCodeFile(next);
      if (next.source === "scratch") {
        updateCode({ editor: next.content, language: next.path.split(".").pop() || "txt" });
        void saveRemoteScratchFile(next).catch(() => undefined);
      }
      return next;
    }));
  }

  function renameActiveScratchFile(value: string) {
    if (!activeFile || activeFile.source !== "scratch") return;
    const filename = basename(value).trim();
    setFileNameDraft(null);
    if (!filename || files.some((file) => file.id !== activeFile.id && file.workspaceId === activeFile.workspaceId && file.path === filename)) {
      setError(!filename ? "File name cannot be empty." : `A file named ${filename} already exists.`);
      return;
    }
    const detected = languageFromPath(filename);
    updateFile(activeFile.id, { path: filename, language: detected === "plaintext" ? activeFile.language : detected });
    setError(null);
  }

  async function deleteActiveFile() {
    if (!activeFile) return;
    const isRepositoryFile = activeFile.source === "github";
    const message = isRepositoryFile
      ? `Stage ${activeFile.path} for deletion in a draft pull request?`
      : `Permanently delete ${activeFile.path}?`;
    if (!window.confirm(message)) return;
    setIsBusy(true);
    setError(null);
    try {
      if (isRepositoryFile) {
        const deletionPatch = await createManualPatchSet({
          repository: activeFile.repository || repository,
          baseBranch,
          baseSha,
          summary: `Delete ${activeFile.path}`,
          changes: [{ operation: "delete", path: activeFile.path, content: "", rationale: "File deletion requested by the user." }],
        });
        setPatchSet(deletionPatch);
        setRightTab("changes");
        setAssistantStatus(`${activeFile.path} is staged for deletion. Review the change, then create a draft pull request.`);
      } else {
        await Promise.all([
          deleteCodeFile(activeFile.id),
          deleteRemoteScratchFile(activeFile.id).catch(() => ({ ok: false })),
        ]);
        const remaining = files.filter((file) => file.id !== activeFile.id);
        setFiles(remaining);
        setActiveFileId(remaining[0]?.id || null);
        setFileNameDraft(null);
        if (!remaining.length) updateCode({ editor: "", language: "ts" });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the file.");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteScratchFileFromList(file: CodeFile) {
    if (file.source !== "scratch" || !window.confirm(`Permanently delete ${file.path}?`)) return;
    setIsBusy(true);
    setError(null);
    try {
      await Promise.all([
        deleteCodeFile(file.id),
        deleteRemoteScratchFile(file.id).catch(() => ({ ok: false })),
      ]);
      const remaining = files.filter((item) => item.id !== file.id);
      setFiles(remaining);
      if (activeFileId === file.id) {
        setActiveFileId(remaining[0]?.id || null);
        setFileNameDraft(null);
      }
      if (!remaining.length) updateCode({ editor: "", language: "ts" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the file.");
    } finally {
      setIsBusy(false);
    }
  }

  async function addScratchFile() {
    const file = migrateLegacyEditor({ editor: "", language: "ts" });
    file.path = `scratch-${files.filter((item) => item.source === "scratch").length + 1}.ts`;
    await Promise.all([saveCodeFile(file), saveRemoteScratchFile(file).catch(() => ({ ok: false }))]);
    setRepository("");
    setTree([]);
    setFiles((current) => [...current, file]);
    setActiveFileId(file.id);
  }

  function saveActiveSnippet() {
    if (!activeFile) return;
    const now = new Date().toISOString();
    const snippet: CodeSnippet = {
      id: crypto.randomUUID(),
      title: basename(activeFile.path),
      language: activeFile.language,
      code: activeFile.content,
      createdAt: now,
      updatedAt: now,
      ...(activeFile.repository ? { source: { repository: activeFile.repository, path: activeFile.path, commitSha: baseSha } } : {}),
    };
    updateCode({ snippets: [snippet, ...code.snippets] });
    setExplorerTab("snippets");
  }

  function renameSnippet(snippet: CodeSnippet, value: string) {
    const filename = basename(value).trim();
    if (!filename) return;
    const detected = languageFromPath(filename);
    updateCode({
      snippets: code.snippets.map((item) => item.id === snippet.id ? {
        ...item,
        title: filename,
        language: detected === "plaintext" ? item.language : detected,
        updatedAt: new Date().toISOString(),
      } : item),
    });
    setSnippetNameDrafts((current) => {
      const next = { ...current };
      delete next[snippet.id];
      return next;
    });
  }

  async function openSnippet(snippet: CodeSnippet) {
    const filename = snippetFilename(snippet);
    const file: CodeFile = {
      id: `scratch:${crypto.randomUUID()}`,
      workspaceId: "scratch",
      path: filename,
      language: snippetLanguage(snippet, filename),
      content: snippet.code,
      originalContent: snippet.code,
      source: "scratch",
      dirty: false,
      selectedContext: true,
      lastOpenedAt: Date.now(),
    };
    await Promise.all([saveCodeFile(file), saveRemoteScratchFile(file).catch(() => ({ ok: false }))]);
    setFiles((current) => [...current, file]);
    setActiveFileId(file.id);
  }

  async function askAssistant() {
    if (!prompt.trim()) return;
    if (!contextFiles.length) {
      setError("Select at least one context file.");
      return;
    }
    setIsBusy(true);
    setError(null);
    setPublishUrl(null);
    setAssistantStatus("Analyzing selected context…");
    try {
      const result = await requestCodeAssistance({
        action,
        prompt: prompt.trim(),
        quality,
        repository: repository || undefined,
        baseBranch: baseBranch || undefined,
        baseSha: baseSha || undefined,
        files: contextFiles,
        scratchpad: includeScratchpad ? stripHtml(code.notesHtml) : undefined,
      });
      setPatchSet(result);
      setAssistantStatus(result.explanation);
      setRightTab(result.changes.length ? "changes" : "assistant");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Assistant request failed.");
      setAssistantStatus("The request could not be completed.");
    } finally {
      setIsBusy(false);
    }
  }

  function toggleChange(id: string) {
    setPatchSet((current) => current ? { ...current, changes: current.changes.map((change) => change.id === id ? { ...change, accepted: !change.accepted } : change) } : current);
  }

  async function applyAcceptedChanges() {
    if (!patchSet) return;
    setUndoSnapshot(files.map((file) => ({ ...file })));
    let nextFiles = [...files];
    for (const change of patchSet.changes.filter((item) => item.accepted)) {
      const existing = nextFiles.find((file) => file.path === change.path);
      if (change.operation === "delete") {
        if (existing) {
          await deleteCodeFile(existing.id);
          if (existing.source === "scratch") await deleteRemoteScratchFile(existing.id).catch(() => ({ ok: false }));
        }
        nextFiles = nextFiles.filter((file) => file.path !== change.path);
        continue;
      }
      if (existing) {
        const next = { ...existing, content: change.content || "", dirty: true, lastOpenedAt: Date.now() };
        await saveCodeFile(next);
        if (next.source === "scratch") await saveRemoteScratchFile(next).catch(() => ({ ok: false }));
        nextFiles = nextFiles.map((file) => file.id === next.id ? next : file);
      } else {
        const next: CodeFile = {
          id: `${repository ? `github:${repository}` : "scratch"}:${change.path}`,
          workspaceId: repository ? `github:${repository}` : "scratch",
          path: change.path,
          language: languageFromPath(change.path),
          content: change.content || "",
          originalContent: "",
          source: repository ? "github" : "scratch",
          repository: repository || undefined,
          ref: baseBranch || undefined,
          dirty: true,
          selectedContext: true,
          lastOpenedAt: Date.now(),
        };
        await saveCodeFile(next);
        if (next.source === "scratch") await saveRemoteScratchFile(next).catch(() => ({ ok: false }));
        nextFiles.push(next);
      }
    }
    setFiles(nextFiles);
    setAssistantStatus("Accepted changes are applied locally. Review the editor before publishing.");
  }

  async function undoApply() {
    if (!undoSnapshot) return;
    for (const file of files) await deleteCodeFile(file.id);
    for (const file of undoSnapshot) await saveCodeFile(file);
    setFiles(undoSnapshot);
    setUndoSnapshot(null);
  }

  async function publish() {
    if (!patchSet || !repository) return;
    setIsBusy(true);
    setError(null);
    try {
      const result = await publishPatchSet(patchSet, patchSet.summary || prompt);
      setPublishUrl(result.pullRequestUrl);
      setAssistantStatus(`Draft pull request created on ${result.branch}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish changes.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="code-ide" aria-label="Code Vault workspace">
      <aside className="code-explorer editor-panel">
        <div className="ide-repo-bar">
          <select
            aria-label="Repository"
            value={repository}
            onChange={(event) => {
              const repo = repositories.find((item) => item.fullName === event.target.value);
              if (repo) void chooseRepository(repo);
              else {
                setRepository("");
                setBaseBranch("");
                setBaseSha("");
                setTree([]);
                void listWorkspaceFiles("scratch").then((saved) => { setFiles(saved); setActiveFileId(saved[0]?.id || null); });
              }
            }}
          >
            <option value="">Scratch workspace</option>
            {repositories.map((repo) => <option key={repo.id} value={repo.fullName}>{repo.fullName}</option>)}
          </select>
          {!githubConnected ? (
            <button type="button" disabled={!githubConfigured} onClick={() => void beginGithubConnection()} title={githubConfigured ? "Connect GitHub" : "Configure the GitHub App server environment first"}>Connect</button>
          ) : (
            <button type="button" onClick={() => void disconnectGithub().then(() => refreshRepositories())}>Disconnect</button>
          )}
        </div>
        <div className="ide-tabs compact-tabs">
          <button type="button" className={explorerTab === "files" ? "active" : ""} onClick={() => setExplorerTab("files")}>Files</button>
          <button type="button" className={explorerTab === "snippets" ? "active" : ""} onClick={() => setExplorerTab("snippets")}>Snippets <span>{code.snippets.length}</span></button>
        </div>
        <div className="explorer-scroll">
          {explorerTab === "files" ? (
            <>
              <button className="explorer-action" type="button" onClick={() => void addScratchFile()}>+ New scratch file</button>
              {repository ? visibleTree.map((entry) => (
                <button className="file-row" type="button" key={entry.sha + entry.path} onClick={() => void openTreeFile(entry)} title={entry.path}>
                  <span>{entry.path}</span><small>{entry.size ? `${Math.ceil(entry.size / 1024)} KB` : ""}</small>
                </button>
              )) : files.map((file) => (
                <div className={`scratch-file-row ${file.id === activeFileId ? "active" : ""}`} key={file.id}>
                  <button className="file-row" type="button" onClick={() => setActiveFileId(file.id)}>
                    <span>{file.dirty ? "● " : ""}{file.path}</span>
                  </button>
                  <button className="scratch-delete" type="button" aria-label={`Delete ${file.path}`} disabled={isBusy} onClick={() => void deleteScratchFileFromList(file)}>×</button>
                </div>
              ))}
            </>
          ) : code.snippets.map((snippet) => (
            <article className="snippet-card snippet-edit-card" key={snippet.id}>
              <input
                aria-label={`Snippet filename ${snippet.title}`}
                value={snippetNameDrafts[snippet.id] ?? snippetFilename(snippet)}
                onChange={(event) => setSnippetNameDrafts((current) => ({ ...current, [snippet.id]: event.target.value }))}
                onBlur={(event) => renameSnippet(snippet, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    setSnippetNameDrafts((current) => {
                      const next = { ...current };
                      delete next[snippet.id];
                      return next;
                    });
                  }
                }}
                spellCheck={false}
              />
              <span>{snippetLanguage(snippet)}{snippet.source ? ` · ${snippet.source.repository}` : ""}</span>
              <button type="button" onClick={() => void openSnippet(snippet)}>Open</button>
            </article>
          ))}
        </div>
      </aside>

      <section className="code-editor-workbench editor-panel">
        <div className="open-file-tabs">
          {files.map((file) => (
            <button key={file.id} type="button" className={file.id === activeFileId ? "active" : ""} onClick={() => setActiveFileId(file.id)}>
              {basename(file.path)}{file.dirty ? " •" : ""}
            </button>
          ))}
        </div>
        <div className="editor-actions">
          {activeFile?.source === "scratch" ? (
            <input
              className="active-file-name"
              aria-label="File name"
              value={fileNameDraft ?? activeFile.path}
              onChange={(event) => setFileNameDraft(event.target.value)}
              onBlur={(event) => renameActiveScratchFile(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") setFileNameDraft(null);
              }}
              spellCheck={false}
            />
          ) : <span title={activeFile?.path}>{activeFile?.path || "No file open"}</span>}
          {activeFile && <label className="context-toggle"><input type="checkbox" checked={activeFile.selectedContext} onChange={(event) => updateFile(activeFile.id, { selectedContext: event.target.checked })} /> AI context</label>}
          <button type="button" disabled={!activeFile} onClick={saveActiveSnippet}>Save snippet</button>
          <button className="danger-action" type="button" disabled={!activeFile || isBusy} onClick={() => void deleteActiveFile()}>Delete file</button>
        </div>
        <div className="monaco-frame">
          {activeFile ? (
            <Suspense fallback={<div className="editor-loading">Loading code editor…</div>}>
              <MonacoEditor
                path={monacoModelPath(activeFile)}
                language={activeFile.language}
                theme="vs-dark"
                value={activeFile.content}
                beforeMount={configureMonaco}
                onChange={(value) => updateFile(activeFile.id, { content: value || "", dirty: (value || "") !== activeFile.originalContent })}
                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on", automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 14 }, tabSize: 2 }}
              />
            </Suspense>
          ) : <div className="editor-empty">Choose a repository file or create a scratch file.</div>}
        </div>
      </section>

      <aside className="code-assistant editor-panel">
        <div className="ide-tabs">
          <button type="button" className={rightTab === "assistant" ? "active" : ""} onClick={() => setRightTab("assistant")}>Assistant</button>
          <button type="button" className={rightTab === "changes" ? "active" : ""} onClick={() => setRightTab("changes")}>Changes <span>{patchSet?.changes.length || 0}</span></button>
        </div>
        {rightTab === "assistant" ? (
          <div className="assistant-pane">
            <div className="assistant-controls">
              <select value={action} onChange={(event) => setAction(event.target.value as AssistantAction)} aria-label="Assistant action">
                {actionLabels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select value={quality} onChange={(event) => setQuality(event.target.value as "balanced" | "best")} aria-label="AI quality">
                <option value="balanced">Balanced</option><option value="best">Best quality</option>
              </select>
            </div>
            <div className="context-list"><strong>Context</strong>{contextFiles.map((file) => <span key={file.id}>{file.path}</span>)}</div>
            <div className="assistant-answer">{assistantStatus}</div>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the change, question, or review…" aria-label="Coding assistant prompt" />
            <label className="context-toggle"><input type="checkbox" checked={includeScratchpad} onChange={(event) => setIncludeScratchpad(event.target.checked)} /> Include task scratchpad</label>
            <button className="primary-action" type="button" disabled={isBusy || !prompt.trim()} onClick={() => void askAssistant()}>{isBusy ? "Working…" : actionLabels.find((item) => item.value === action)?.label}</button>
          </div>
        ) : (
          <div className="changes-pane">
            {!patchSet ? <p>No proposed changes yet.</p> : (
              <>
                <h3>{patchSet.summary}</h3>
                {patchSet.warnings.map((warning) => <p className="change-warning" key={warning}>{warning}</p>)}
                {patchSet.changes.map((change) => (
                  <article className={`change-card ${change.accepted ? "accepted" : ""}`} key={change.id}>
                    <label><input type="checkbox" checked={change.accepted} onChange={() => toggleChange(change.id)} /> <strong>{change.operation.toUpperCase()}</strong> {change.path}</label>
                    <p>{change.rationale}</p>
                    {change.content !== undefined && <pre>{change.content.slice(0, 2200)}{change.content.length > 2200 ? "\n…" : ""}</pre>}
                  </article>
                ))}
                <div className="change-actions">
                  <button type="button" onClick={() => void applyAcceptedChanges()}>Apply accepted</button>
                  <button type="button" disabled={!undoSnapshot} onClick={() => void undoApply()}>Undo apply</button>
                  <button className="primary-action" type="button" disabled={!repository || isBusy || !patchSet.changes.some((item) => item.accepted)} onClick={() => void publish()}>Create draft PR</button>
                </div>
                {publishUrl && <a className="pr-link" href={publishUrl} target="_blank" rel="noreferrer">Open draft pull request</a>}
              </>
            )}
          </div>
        )}
        {error && <div className="ide-error" role="alert">{error}</div>}
        {isBusy && <div className="ide-busy">Working…</div>}
      </aside>
    </div>
  );
}
