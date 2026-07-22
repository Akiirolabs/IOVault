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
  Evidence --> Runs["Append-only implementation runs"]
  Runs --> Status["Delivery status"]
  Status --> Roadmap
```

The [implementation system](implementation-system/README.md) is authoritative for feature delivery state and steps. The [debug system](debug-system/README.md) remains authoritative for individual defects and security findings.

## Ownership boundaries

| Data | Durable source | Browser copy | Notes |
|---|---|---|---|
| General workspace | SQLite `workspaces.data` | localStorage cache | Full `VaultState`; last-write-wins remains a known limitation |
| Notes pages and collections | `VaultState.write` via SQLite | React/localStorage | Versioned hierarchy; legacy `docHtml` migrates into the first note |
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

## Core endpoints

| Group | Routes | Auth | Responsibility |
|---|---|---|---|
| Auth | `/api/auth/signup`, `/login`, `/logout`, `/me` | Cookie session; CSRF on logout | User identity |
| Vault | `GET/PUT /api/vault` | Cookie; CSRF on write | Load/save `VaultState` |
| General AI | `POST /api/agent` | Cookie + CSRF + limits | Context-minimized assistant |
| Code Vault | `/api/code/github/*`, `/scratch/*`, `/assist/stream`, `/publish` | Cookie; CSRF on mutations | Repository, scratch, AI patch, and PR workflows |

## Known constraints

The development JWT-secret fallback, whole-workspace JSON persistence, and last-write-wins sync remain tracked in [debug-system](debug-system/issue-register.md). Bearer tokens remain supported for non-browser API compatibility but are no longer stored or returned to the SPA.
