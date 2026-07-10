# Server, Sign-In & SQL Database

> **Status: Implemented (v1).** Users sign in and their full `VaultState` is stored per-user in a SQL database. See [`architecture.md`](./architecture.md) for diagrams.

## What shipped (v1)

- **Database:** SQLite (free, zero-config, file at `server/data/iovault.db`, git-ignored, auto-created). It's a real SQL DB and is swappable for hosted Postgres later (see "Recommended stack" below).
- **Backend (`server/`):**
  - `db.js` — SQLite connection + schema (`users`, `workspaces`) + query helpers.
  - `auth.js` — `bcryptjs` password hashing, `jsonwebtoken` JWTs, and a `requireAuth` middleware.
  - `index.js` — routes: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/vault`, `PUT /api/vault` (plus the existing `/api/agent`).
- **Frontend (`src/App.tsx`):** a sign-in/sign-up `AuthScreen`, token stored in `localStorage` (`io-vault-token`), an authed `apiFetch`, an auth gate before the app, vault **load on login**, **debounced save** (~800ms) on every edit, a sync-status pill + Sign out in the top bar, and `localStorage` kept as an offline cache.
- **Model:** v1 stores the entire `VaultState` as a JSON blob per user in `workspaces.data` (see below).
- **Env:** `JWT_SECRET` (optional; a dev fallback is used locally), `DATABASE_FILE` (optional path override). Reminder: the Express server reads env at startup and does not hot-reload — restart `npm run dev` after changing env.

The sections below document the design and the production upgrade path (hosted Postgres / Supabase).

## Goal

- Add authentication (sign up / sign in / sign out).
- Persist each user's entire workspace server-side in SQL instead of only `localStorage`.
- Keep `localStorage` as an offline cache / fast first paint.
- Stay on free tiers.

## Current state (what changes)

- Today everything is client-only: `getSavedVaultState()` reads `localStorage["io-vault-workspace"]` and `saveVaultState()` writes it on every edit (see `src/App.tsx`).
- There is already an Express server (`server/index.js`) and Vite proxies `/api` → `http://localhost:8787` (`vite.config.ts`). We extend this server with auth + vault endpoints.

## Recommended stack

**Primary recommendation: Supabase** (Postgres + built-in Auth, generous free tier).

- SQL database: **Postgres** (managed by Supabase).
- Auth: **Supabase Auth** (email/password + optional OAuth) — avoids hand-rolling password hashing/sessions.
- Access: Supabase JS client from the frontend, secured by **Row Level Security (RLS)** so each user only reads/writes their own rows. The Express server becomes optional for data (Supabase client can talk to the DB directly under RLS), and stays for the existing `/api/agent` AI route.

**Alternative: Neon (free serverless Postgres) + custom auth on the Express server.**

- SQL database: **Neon** Postgres (free tier) — or **Turso** (libSQL/SQLite) if you prefer SQLite.
- Auth: implement on Express — `bcrypt` for password hashing, `jsonwebtoken` (JWT) or signed HTTP-only session cookies.
- Data access: all through Express endpoints (below). More code than Supabase, but fully in-repo and provider-agnostic.

> Note: some providers change free tiers over time (e.g. PlanetScale removed its free tier). Supabase, Neon, and Turso currently offer free tiers suitable for this app.

## Data model

### v1 — single JSON blob per user (fastest migration)

Because the app already serializes the whole `VaultState` to one string, the simplest first step mirrors that server-side:

```sql
-- users handled by Supabase Auth (auth.users) OR this table for the custom-auth path
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,        -- custom-auth path only
  created_at timestamptz default now()
);

create table workspaces (
  user_id uuid primary key references users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,   -- the entire VaultState
  updated_at timestamptz default now()
);
```

- Save = upsert the whole `VaultState` into `workspaces.data`.
- Load on sign-in = read `workspaces.data`, then hydrate app state.
- Pros: minimal code, matches current architecture. Cons: no per-entity querying.

### v2 — normalized tables (later, optional)

Split `VaultState` into real tables once server-side querying/sharing is needed:

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text, status text, body text,
  doc_html text, doc_markdown text,
  created_at timestamptz default now()
);
-- and: code_snippets, learning_docs, career, settings, etc.
```

Recommend shipping **v1 first**, migrating to v2 only if features need it.

## Auth flow

1. **Sign up:** email + password → create user (Supabase Auth, or hash with `bcrypt` and insert on the custom path).
2. **Sign in:** returns a session token (Supabase session, or a JWT/HTTP-only cookie).
3. Frontend keeps the session; the current **Unlock** screen becomes the real sign-in screen (or add a sign-in step before it).
4. **Sign out:** clear the session/cookie.
5. All vault reads/writes are scoped to the authenticated user (RLS on Supabase, or `user_id` from the verified token on the custom path).

## API endpoints (custom-auth / Express path)

Extend `server/index.js` (all under `/api`, already proxied by Vite):

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create account, return session |
| `POST` | `/api/auth/login` | Verify credentials, return session |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/auth/me` | Current user from token |
| `GET` | `/api/vault` | Load this user's `VaultState` |
| `PUT` | `/api/vault` | Upsert this user's `VaultState` |

(With Supabase, most of these are handled by the Supabase client + RLS instead of custom routes.)

## Frontend integration

- Replace direct `localStorage` reads/writes in `src/App.tsx`:
  - On sign-in: `GET /api/vault` (or Supabase select) → `normalizeVaultState(...)` → set state.
  - On edit: keep the existing `saveVaultState` reducer, but also **debounced** push to the server (`PUT /api/vault`) — e.g. save to `localStorage` immediately (instant UX) and sync to SQL ~1s after the last change.
- **Offline cache:** keep `localStorage` as the source for first paint and offline edits; reconcile with the server on next successful sync (last-write-wins for v1; add `updated_at` checks to reduce clobbering).
- **Migration:** on a user's first login, if the server vault is empty but `localStorage` has data, upload the local `VaultState` so existing local work isn't lost.

## Env vars / secrets

Store via `.env`/`.env.local` (git-ignored) or Cursor Secrets — never commit:

- Supabase path: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (safe to expose to client under RLS).
- Custom path: `DATABASE_URL` (Neon/Turso connection string), `JWT_SECRET`, `AUTH_COOKIE_SECRET`.
- Reminder (see `AGENTS.md`): the Express server reads env once at startup and does **not** auto-reload — restart `npm run dev` after changing env values.

## Security considerations

- Never store plaintext passwords — `bcrypt`/`argon2` hashing (or delegate to Supabase Auth).
- Enforce per-user isolation: Supabase **RLS policies** (`auth.uid() = user_id`) or server-side `user_id` checks from the verified token on every query.
- Use HTTP-only, `Secure`, `SameSite` cookies for sessions (or short-lived JWT + refresh).
- Validate/limit payload size on `PUT /api/vault` (the app already uses `express.json({ limit: "1mb" })`).
- Serve over HTTPS in production.

## Rollout steps (suggested)

1. Pick provider (recommend Supabase) and create the free project + `workspaces` table (v1 JSON blob).
2. Add auth (Supabase Auth or Express `bcrypt`+JWT) and a sign-in screen.
3. Wire vault **load on login** and **debounced save** on edit; keep `localStorage` as cache.
4. Add first-login migration from `localStorage` → server.
5. (Later) Normalize to v2 tables if per-entity querying/sharing is needed.

## Open questions

- Email/password only, or also OAuth (Google/GitHub)? Supabase makes OAuth easy.
- Conflict strategy for multi-device edits: last-write-wins (simple) vs per-section merge (more work).
- Should the AI route (`/api/agent`) also become per-user (e.g. rate limits, saved chat history)? Out of scope for v1 but natural once auth exists.
