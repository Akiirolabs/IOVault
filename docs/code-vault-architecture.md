# Code Vault Page Architecture

Code Vault is a browser mini IDE built around three visible work areas: an Explorer, a Monaco editor, and an AI Assistant/Changes panel. GitHub is the source of truth for repositories, IndexedDB is the fast browser cache, and SQLite stores durable user-owned workspace records.

## Architecture chart

| Layer | Component | Responsibility | Reads from | Writes to |
| --- | --- | --- | --- | --- |
| UI | Files/Snippets Explorer | Select repositories, open files, create scratch files, and reuse snippets | GitHub repository API, IndexedDB, `VaultState` | Active workspace and file selection |
| UI | Monaco Editor | Edit text files with syntax highlighting, tabs, diagnostics, and dirty-state tracking | Opened `CodeFile` records | IndexedDB and durable scratch-file API |
| UI | Assistant | Select an AI action, model tier, context files, prompt, and optional scratchpad | Checked editor files and Code Vault notes | `/api/code/assist/stream` |
| UI | Changes Review | Review, accept, reject, apply, undo, and publish proposed file changes | Stored `PatchSet` | Local working files and `/api/code/publish` |
| Browser storage | IndexedDB | Cache opened repository files and immediate scratch edits with LRU eviction | GitHub/API responses | Maximum approximately 25 MB of browser data |
| App state | `VaultState` | Preserve snippets, notes, legacy code fields, and navigation settings | SQLite workspace JSON and `localStorage` cache | Debounced `/api/vault` synchronization |
| API | Express Code Vault routes | Authenticate requests, enforce limits, coordinate AI and GitHub operations | Bearer JWT, request payloads | SQLite, OpenAI, and GitHub APIs |
| Database | SQLite Code Vault tables | Store scratch files, GitHub installation IDs, AI patch sets, sessions, and publication history | Express server | Durable user-scoped records |
| AI | OpenAI Responses API | Explain code and generate structured, complete-file patch proposals | Maximum 12 explicitly selected files and optional scratchpad | Validated structured `PatchSet` |
| Repository | GitHub App integration | Read repository trees/files and create branches, commits, and draft pull requests | Short-lived installation token | GitHub repository |

## Page layout map

```mermaid
flowchart LR
  subgraph Page["Code Vault page"]
    direction LR

    subgraph Explorer["Explorer panel"]
      Repo["Repository selector"]
      Files["Files tab"]
      Snippets["Snippets tab"]
      NewScratch["New scratch file"]
    end

    subgraph Workbench["Editor workbench"]
      Tabs["Open file tabs"]
      ContextToggle["AI context toggle"]
      Monaco["Monaco editor"]
      SaveSnippet["Save snippet"]
    end

    subgraph RightPanel["Assistant / Changes panel"]
      Assistant["Assistant actions"]
      ContextList["Visible context list"]
      Prompt["Task prompt"]
      Scratchpad["Optional task scratchpad"]
      Review["Per-file change review"]
      Apply["Apply / undo"]
      Publish["Create draft PR"]
    end
  end

  Repo --> Files
  NewScratch --> Tabs
  Files --> Tabs
  Snippets --> Tabs
  Tabs --> Monaco
  ContextToggle --> ContextList
  Monaco --> SaveSnippet
  SaveSnippet --> Snippets
  ContextList --> Assistant
  Prompt --> Assistant
  Scratchpad --> Assistant
  Assistant --> Review
  Review --> Apply
  Review --> Publish
```

## System architecture map

```mermaid
flowchart TB
  User["Signed-in user"]

  subgraph Browser["React browser application"]
    CV["CodeVaultWorkspace"]
    Explorer["Files / Snippets Explorer"]
    Editor["Lazy-loaded Monaco editor"]
    Assistant["Assistant / Changes UI"]
    IDB[("IndexedDB\n25 MB bounded cache")]
    Vault["VaultState\nsnippets + notes + legacy fields"]
  end

  subgraph Server["Express API"]
    Auth["JWT authentication"]
    CodeRoutes["/api/code/*"]
    VaultRoutes["/api/vault"]
    Validation["Path, size, context, and stale-SHA validation"]
    GithubService["GitHub App service"]
    AIService["OpenAI Responses service"]
  end

  DB[("SQLite")]
  OpenAI["OpenAI Responses API"]
  GitHub["GitHub repositories"]

  User --> CV
  CV --> Explorer
  CV --> Editor
  CV --> Assistant

  Explorer <--> IDB
  Editor <--> IDB
  Explorer <--> Vault
  Assistant -->|"Selected files only"| CodeRoutes
  Vault --> VaultRoutes

  CodeRoutes --> Auth
  VaultRoutes --> Auth
  Auth --> Validation
  Validation --> AIService
  Validation --> GithubService

  AIService -->|"Structured request"| OpenAI
  OpenAI -->|"Validated patch proposal"| AIService

  GithubService -->|"Short-lived installation token"| GitHub
  GitHub -->|"Trees, files, refs, commits, PRs"| GithubService

  CodeRoutes <--> DB
  VaultRoutes <--> DB
  VaultRoutes --> Vault
```

## Storage ownership map

| Data | Browser memory | IndexedDB | `VaultState` | SQLite | GitHub |
| --- | :---: | :---: | :---: | :---: | :---: |
| Currently rendered file | Yes | Yes | No | Scratch only | Repository files |
| Open repository file cache | Limited | Yes | No | No | Source of truth |
| Unsaved repository edits | Active files | Yes | No | No | No |
| Scratch files | Active files | Yes | Legacy mirror only | Yes | No |
| Snippets and provenance | Active view | No | Yes | Through vault sync | Optional source reference |
| Task notes | Active view | No | Yes | Through vault sync | No |
| AI patch sets | Active review | No | No | Yes | Published result only |
| GitHub installation token | No | No | No | No | Generated temporarily |
| GitHub installation ID | No | No | No | Yes | Yes |
| Branches, commits, and PRs | Metadata only | No | No | Publication history | Source of truth |

## AI change workflow

```mermaid
sequenceDiagram
  actor U as User
  participant UI as Code Vault UI
  participant API as Express API
  participant AI as OpenAI Responses API
  participant DB as SQLite
  participant GH as GitHub

  U->>UI: Select context files
  U->>UI: Choose action and enter task
  UI->>API: POST /api/code/assist/stream
  Note over UI,API: Maximum 12 files and 300,000 characters
  API->>API: Authenticate and validate paths/content
  API->>AI: Task + explicitly selected context
  AI-->>API: Structured explanation and file changes
  API->>API: Validate every proposed change
  API->>DB: Store user-owned PatchSet
  API-->>UI: SSE result event

  U->>UI: Accept or reject each file
  U->>UI: Apply accepted changes locally
  UI->>UI: Update IndexedDB working copy

  opt Publish GitHub-backed changes
    U->>UI: Create draft PR
    UI->>API: POST /api/code/publish
    API->>DB: Load owned PatchSet
    API->>GH: Revalidate base branch SHA
    alt Base branch is unchanged
      API->>GH: Create blobs and atomic Git tree
      API->>GH: Create commit and iovault/* branch
      API->>GH: Open draft pull request
      API->>DB: Store publication history
      API-->>UI: Branch, commit, and PR URL
    else Base branch changed
      API-->>UI: 409 stale-base conflict
    end
  end
```

## Safety and resource boundaries

```mermaid
flowchart LR
  Request["File or AI request"] --> Auth{"Authenticated?"}
  Auth -->|No| Reject401["Reject: 401"]
  Auth -->|Yes| Path{"Safe repository path?"}
  Path -->|No| RejectPath["Reject traversal or secret path"]
  Path -->|Yes| Size{"Within limits?"}
  Size -->|No| RejectSize["Reject oversized context/file"]
  Size -->|Yes| Binary{"Text file?"}
  Binary -->|No| RejectBinary["Reject binary file"]
  Binary -->|Yes| Review["Generate reviewable proposal"]
  Review --> Approval{"User accepted changes?"}
  Approval -->|No| Stop["No repository mutation"]
  Approval -->|Yes| Fresh{"Base SHA still current?"}
  Fresh -->|No| Conflict["Stop with stale-base conflict"]
  Fresh -->|Yes| DraftPR["Atomic commit + draft PR"]
```

