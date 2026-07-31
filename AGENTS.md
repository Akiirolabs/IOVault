# Progress Command Center (IO Vault)

Personal productivity dashboard: a Vite + React + TypeScript SPA with a required Express API, per-user SQLite persistence, offline browser caching, optional AI features, and a GitHub-backed Code Vault mini IDE.

## Cursor Cloud specific instructions

### Services
- Frontend (Vite dev server): `http://localhost:5173` — this IS the product; required to run/test anything.
- API (Express, `server/index.js`): `http://localhost:8787` — now REQUIRED for the normal flow: it powers user sign-in/sign-up and per-user vault storage (`/api/auth/*`, `/api/vault`) in addition to the optional AI features (`/api/agent`). The app shows a sign-in screen first and loads/saves the vault via this API. `localStorage` is still used as an offline cache.

### Auth + database
- SQL store: SQLite via `better-sqlite3`, file at `server/data/iovault.db` (git-ignored, auto-created on first run; `server/db.js` runs `CREATE TABLE IF NOT EXISTS`). No manual DB setup needed. Override path with `DATABASE_FILE`.
- Tables include `users`, `workspaces`, AI usage metadata, user-scoped Code Vault records, and dedicated Learning/Career agent profiles, conversations, tasks, runs, approvals, connector actions, and domain records. See `docs/deployment-ledger/DPL-1002-current-testing-state.md`.
- Auth: `server/auth.js` — bcrypt hashing plus a JWT-backed `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production). Unsafe cookie-authenticated requests require `X-IOVault-CSRF: 1`. The SPA never receives or stores the JWT; bearer auth remains available for non-browser API clients. `JWT_SECRET` is optional locally but required for a secure production deployment.
- To reset all accounts/data locally, delete `server/data/` and restart the API.

### Running
- `npm run dev` starts both Vite + Express together (via `concurrently`). Use `npm run dev:web` for frontend-only.
- The Vite dev server proxies `/api/*` to `http://localhost:8787` (see `vite.config.ts`), so run the full `npm run dev` if you need the API reachable from the browser.

### AI / secrets (optional)
- The API reads `OPENAI_API_KEY` from `.env.local` (preferred) or `.env` — both git-ignored. `server/index.js` loads `.env.local` with override, then `.env`. A `process.env.OPENAI_API_KEY` (e.g. a Cursor Secret) also works with no file. Without a key, `POST /api/agent` returns HTTP 400 `"Missing OPENAI_API_KEY in .env.local."` — expected, not a bug. The frontend has an offline fallback for greetings/time/date/simple math.
- The general assistant model is hardcoded to `gpt-4o-mini`.
- Learning and Career use the Responses API with `OPENAI_AGENT_MODEL` (default `gpt-5.6-terra`). Google OAuth requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and a production `CONNECTOR_ENCRYPTION_KEY`; restart the API after changing them.
- GOTCHA: the Express API reads the key once at startup (`const apiKey = process.env.OPENAI_API_KEY`) and does NOT watch env files. Under `npm run dev`, editing `.env`/`.env.local` triggers a **Vite** restart but NOT a restart of the `node server/index.js` process — so the new key is ignored until you restart the whole `npm run dev` command (or the API process). After adding a key, restart dev and confirm the log shows `injected env (1) from .env` (count > 0).

### Lint / typecheck / build
- There is no dedicated lint script. Type checking happens via `tsc -b` as part of `npm run build` (`tsc -b && vite build`). Use `npm run build` as the typecheck + build gate.
- `npm test` runs the Vitest, React Testing Library, and Supertest suite.

### Gotchas
- General workspace state is durable in SQLite and cached in `localStorage` under `io-vault-workspace`; Code Vault also uses IndexedDB and dedicated SQLite tables.
- The app shows authentication before the "Unlock" landing screen.
