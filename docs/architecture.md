# IO Vault Architecture

IO Vault is a Vite/React SPA backed by an Express API and SQLite. Browser caches keep editing responsive; authenticated server storage is authoritative for user-owned records, while GitHub remains authoritative for connected repository files.

## System map

```mermaid
flowchart TB
  User["Signed-in user"] --> SPA["React SPA :5173"]
  SPA --> LS[("localStorage\nVaultState cache + JWT")]
  SPA --> IDB[("IndexedDB\nCode Vault working cache")]
  SPA -->|"/api/* via Vite proxy"| API["Express API :8787"]
  API --> Auth["JWT auth"]
  API --> DB[("SQLite\nusers, workspaces, code records, AI audits")]
  API -->|"bounded selected context"| OpenAI["OpenAI"]
  API -->|"short-lived installation token"| GitHub["GitHub App / repositories"]
```

## Ownership boundaries

| Data | Durable source | Browser copy | Notes |
|---|---|---|---|
| General workspace | SQLite `workspaces.data` | localStorage cache | Full `VaultState`; last-write-wins remains a known limitation |
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
  A-->>R: JWT + user
  R->>A: GET /api/vault with Bearer JWT
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
| Auth | `/api/auth/signup`, `/login`, `/me` | Public login/signup; Bearer for `/me` | User identity |
| Vault | `GET/PUT /api/vault` | Bearer | Load/save `VaultState` |
| General AI | `POST /api/agent` | Bearer + limits | Context-minimized assistant |
| Code Vault | `/api/code/github/*`, `/scratch/*`, `/assist/stream`, `/publish` | Bearer | Repository, scratch, AI patch, and PR workflows |

## Known constraints

Browser-readable JWTs, the development JWT-secret fallback, whole-workspace JSON persistence, and last-write-wins sync are tracked in [debug-system](debug-system/issue-register.md).
