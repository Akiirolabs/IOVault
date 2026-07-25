# IO Vault Architecture

IO Vault is a Vite/React SPA backed by an Express API and SQLite. Browser caches keep editing responsive; authenticated server storage is authoritative for user-owned records, while GitHub remains authoritative for connected repository files.

## System map

> **Legacy reference map — preserved unchanged.** This map remains the compact runtime snapshot that existed before the implementation system. The current planning and delivery architecture is added below it.

```mermaid
flowchart TB
  User["Signed-in user"] --> SPA["React SPA :5173"]
  SPA --> LS[("localStorage\nVaultState cache only")]
  SPA --> IDB[("IndexedDB\nCode Vault working cache")]
  SPA -->|"HttpOnly cookie + CSRF header\n/api/* via Vite proxy"| API["Express API :8787"]
  API --> Auth["JWT-backed cookie session"]
  API --> DB[("SQLite\nusers, workspaces, code records, AI audits")]
  API -->|"bounded selected context"| OpenAI["OpenAI"]
  API -->|"short-lived installation token"| GitHub["GitHub App / repositories"]
```

## Current implementation architecture

The runtime remains the product architecture; the implementation system adds a documentation control layer around planned changes without becoming part of the deployed application.

```mermaid
flowchart TB
  Roadmap["Roadmap priorities"] --> Register["Implementation register"]
  Debug["Debug system evidence"] --> Register
  Register --> Areas["IMP area plans"]
  Areas --> Runtime["React, Express, SQLite, IndexedDB"]
  Areas --> Verify["Verification panel"]
  Runtime --> Evidence["Tests, build, and workflow evidence"]
  Verify --> Evidence
  Evidence --> Log["Implementation log"]
  Log --> Register
```

The [implementation system](implementation-system/README.md) is authoritative for feature delivery state and steps. The [debug system](debug-system/README.md) remains authoritative for individual defects and security findings.

## Ownership boundaries

| Data | Durable source | Browser copy | Notes |
|---|---|---|---|
| General workspace | SQLite `workspaces.data` | localStorage cache | Full `VaultState`; last-write-wins remains a known limitation |
| Notes pages and collections | `VaultState.write` via SQLite | React/localStorage | Versioned collapsible hierarchy; Page cells store linked page IDs; legacy `docHtml` migrates into the first note |
| Code snippets and notes | `VaultState` via SQLite | React/localStorage | Reusable globally; optional repository provenance |
| Scratch files | SQLite code tables | IndexedDB working cache | User-scoped |
| GitHub files | GitHub repository | IndexedDB bounded cache | Not stored in `VaultState` |
| AI patch sets/publications | SQLite | Active React review state | Published changes become GitHub commits/PRs |
| AI usage | SQLite metadata only | None | Never stores prompts or vault content |

## Main flows

### Authentication and workspace sync

```mermaid
sequenceDiagram
  actor U as User
  participant R as React
  participant A as Express
  participant D as SQLite
  U->>R: Sign up or sign in
  R->>A: Auth request
  A->>D: Create/verify user
  A-->>R: HttpOnly SameSite cookie + user
  R->>A: GET /api/vault with cookie
  A-->>R: VaultState or null
  U->>R: Edit workspace
  R->>R: Update local cache immediately
  R->>A: Debounced PUT /api/vault
  A->>D: Upsert user workspace
```

### AI context policy

The general assistant sends no vault context by default. A visible checkbox can include only a bounded summary of the active page. The server ignores legacy `vaultData`, caps selected context at 64 KB, authenticates and rate-limits requests, and stores content-free usage metadata. Code Vault has a separate selected-file patch workflow documented in [code-vault-architecture.md](code-vault-architecture.md).

## Approved target direction

```mermaid
flowchart TB
  Shell["Accessible application shell"] --> Notes["Notes / Write"]
  Shell --> Projects["Projects"]
  Shell --> Code["Code Vault"]
  Shell --> Learning["Mentor Agent workspace"]
  Shell --> Career["Career Agent workspace"]
  Notes & Projects --> Workspace["Versioned workspace services"]
  Learning & Career --> Agents["User-scoped agent orchestrator"]
  Agents --> Workspace
  Agents --> Policy["Policy, approval, schedule, and audit engine"]
  Policy --> Integrations["Server-side connector gateway"]
  Integrations --> Providers["Approved learning, email, calendar, job, ATS, and freelance services"]
  Code --> CodeData["Bounded repository and scratch services"]
  Workspace & CodeData --> API["Validated focused API modules"]
  API --> SQL["User-scoped SQLite / future Postgres"]
  API --> Integrations["Short-lived external integrations"]
```

The target keeps pages independently testable, shares structured content primitives deliberately, and resolves storage, synchronization, validation, and module-boundary risks through their authoritative DBG records.

### Planned agent boundaries

| Boundary | Requirement |
|---|---|
| Agent identity | Separate Mentor and Career agents share user-approved evidence, not unrestricted workspace access |
| Durable state | Profiles, plans, opportunities, applications, sessions, policies, approvals, and run results use user-scoped records |
| Credentials | OAuth tokens and connector secrets stay encrypted server-side and never enter `VaultState`, localStorage, prompts, or logs |
| Autonomy | Schedules and policies define allowed triggers, actions, limits, and pause conditions |
| External effects | Every enrollment, message, proposal, or application is idempotent and recorded; unsupported or sensitive steps pause for approval |
| Observability | Run history records trigger, selected context, action, outcome, cost metadata, and errors without storing hidden reasoning |

## Preserved legacy reference diagrams

These original diagrams are retained unchanged for historical comparison. Current ownership and constraints are defined by the sections above.

### Product navigation

```mermaid
flowchart TD
  Start["Open IO Vault"] --> Auth["Sign in / sign up"]
  Auth --> Unlock["Unlock workspace"]
  Unlock --> Shell["Dashboard shell"]
  Shell --> Agent["Global AI drawer"]
  Shell --> Code["Code Vault mini IDE"]
  Shell --> Write["Write"]
  Shell --> Learn["Learning"]
  Shell --> Career["Career"]
  Shell --> Projects["Projects"]
```

### Persistence flow

```mermaid
flowchart LR
  Edit["Workspace edit"] --> State["React VaultState"]
  State -->|"immediate cache"| Local[("localStorage")]
  State -->|"debounced authenticated save"| API["/api/vault"]
  API --> SQL[("SQLite workspace JSON")]
  CodeEdit["Code Vault edit"] --> Monaco["Monaco model"]
  Monaco --> IDB[("IndexedDB cache")]
  Monaco --> Scratch["SQLite scratch file"]
  Repo["GitHub file"] --> IDB
```

### General AI request

```mermaid
sequenceDiagram
  actor U as User
  participant R as React
  participant A as Authenticated /api/agent
  participant O as OpenAI
  U->>R: Ask question
  opt User enables current-page context
    R->>R: Build bounded active-page summary
  end
  R->>A: Message + optional selected context
  A->>A: Auth, rate limit, 8k/64KB validation
  A->>O: Minimal request
  O-->>A: Answer
  A-->>R: Answer + model
```

### Responsive policy

Desktop structure is preserved on narrow screens. A minimum-width workspace scrolls horizontally instead of stacking panels or converting the sidebar into a top rail.

## Core endpoints

| Group | Routes | Auth | Responsibility |
|---|---|---|---|
| Auth | `/api/auth/signup`, `/login`, `/logout`, `/me` | Cookie session; CSRF on logout | User identity |
| Vault | `GET/PUT /api/vault` | Cookie; CSRF on write | Load/save `VaultState` |
| General AI | `POST /api/agent` | Cookie + CSRF + limits | Context-minimized assistant |
| Code Vault | `/api/code/github/*`, `/scratch/*`, `/assist/stream`, `/publish` | Cookie; CSRF on mutations | Repository, scratch, AI patch, and PR workflows |

## Known constraints

The development JWT-secret fallback, whole-workspace JSON persistence, and last-write-wins sync remain tracked in [debug-system](debug-system/issue-register.md). Bearer tokens remain supported for non-browser API compatibility but are no longer stored or returned to the SPA.
