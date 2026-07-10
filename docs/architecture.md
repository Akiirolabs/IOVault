# Architecture — Server, Auth & SQL Sync

Visual overview of how IO Vault changed from a purely client-side app (browser `localStorage`) to a signed-in app whose data is stored per user in a SQL database.

## Before vs after

```mermaid
flowchart LR
  subgraph Before["Before (client only)"]
    B1[React app] -->|read/write| B2[(localStorage)]
  end
  subgraph After["After (accounts + SQL)"]
    A1[React app] -->|cache| A2[(localStorage)]
    A1 -->|"/api auth + vault (Bearer JWT)"| A3[Express API]
    A3 -->|SQL| A4[(SQLite DB)]
  end
```

## Components

```mermaid
flowchart TB
  browser["Browser — React SPA (src/App.tsx)\nAuthScreen · apiFetch · vault sync"]
  vite["Vite dev server :5173\nproxies /api → :8787"]
  api["Express API :8787 (server/index.js)"]
  authmod["server/auth.js\nbcrypt hash · JWT sign/verify · requireAuth"]
  dbmod["server/db.js\nusers · workspaces"]
  sqlite[("SQLite\nserver/data/iovault.db")]
  openai["OpenAI API (optional)"]

  browser -->|"/api/*"| vite --> api
  api --> authmod
  api --> dbmod --> sqlite
  api -->|"/api/agent"| openai
  browser -. "token + vault cache" .-> browser
```

## Data model

```mermaid
erDiagram
  USERS ||--o| WORKSPACES : has
  USERS {
    text id PK
    text email UK
    text password_hash
    text created_at
  }
  WORKSPACES {
    text user_id PK_FK
    text data "JSON: full VaultState"
    text updated_at
  }
```

## Auth flow (sign up / sign in)

```mermaid
sequenceDiagram
  participant U as User
  participant R as React app
  participant A as Express API
  participant D as SQLite
  U->>R: enter email + password
  R->>A: POST /api/auth/signup | /login
  A->>D: insert user / lookup by email
  A->>A: bcrypt hash / compare
  A-->>R: { token (JWT), user }
  R->>R: store token in localStorage
  R->>A: GET /api/vault (Bearer token)
  A->>D: SELECT workspace by user_id
  A-->>R: { data: VaultState | null }
  R->>R: hydrate state (or migrate local cache up)
```

## Vault save (debounced sync on edit)

```mermaid
sequenceDiagram
  participant U as User
  participant R as React app
  participant A as Express API
  participant D as SQLite
  U->>R: edit a project / doc
  R->>R: write localStorage immediately (instant UX)
  R->>R: debounce ~800ms
  R->>A: PUT /api/vault { data } (Bearer token)
  A->>D: UPSERT workspaces(user_id, data)
  A-->>R: { ok: true }
  R->>R: sync pill → "Saved"
```

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | Create account → `{ token, user }` |
| POST | `/api/auth/login` | – | Verify credentials → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/vault` | Bearer | Load the user's `VaultState` (or `null`) |
| PUT | `/api/vault` | Bearer | Upsert the user's `VaultState` |
| POST | `/api/agent` | – | Existing AI assistant route (unchanged) |

See [`server-and-auth.md`](./server-and-auth.md) for implementation details and the path to swap SQLite for hosted Postgres (Supabase/Neon) in production.
