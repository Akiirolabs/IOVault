export type SnippetSource = {
  repository: string;
  path: string;
  commitSha?: string;
  startLine?: number;
  endLine?: number;
};

export type CodeSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  source?: SnippetSource;
};

export type CodeFile = {
  id: string;
  workspaceId: string;
  path: string;
  language: string;
  content: string;
  originalContent: string;
  source: "scratch" | "github";
  repository?: string;
  ref?: string;
  sha?: string;
  dirty: boolean;
  selectedContext: boolean;
  lastOpenedAt: number;
};

export type RepositorySummary = {
  id: number;
  fullName: string;
  defaultBranch: string;
  private: boolean;
};

export type RepositoryTreeEntry = {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

export type ProposedFileChange = {
  id: string;
  operation: "create" | "update" | "delete";
  path: string;
  previousPath?: string;
  content?: string;
  rationale: string;
  accepted: boolean;
};

export type PatchSet = {
  id: string;
  summary: string;
  explanation: string;
  warnings: string[];
  contextFiles: string[];
  repository?: string;
  baseBranch?: string;
  baseSha?: string;
  changes: ProposedFileChange[];
};

export type AssistantAction = "ask" | "explain" | "review" | "fix" | "refactor" | "tests" | "document";

