# Progress Command Center (IO Vault)

Personal productivity dashboard: a Vite + React + TypeScript single-page app with a small Express API for optional AI features. All workspace data persists client-side in browser `localStorage` (no database).

## Cursor Cloud specific instructions

### Services
- Frontend (Vite dev server): `http://localhost:5173` — this IS the product; required to run/test anything.
- API (Express, `server/index.js`): `http://localhost:8787` — now REQUIRED for the normal flow: it powers user sign-in/sign-up and per-user vault storage (`/api/auth/*`, `/api/vault`) in addition to the optional AI features (`/api/agent`). The app shows a sign-in screen first and loads/saves the vault via this API. `localStorage` is still used as an offline cache.

### Auth + database
- SQL store: SQLite via `better-sqlite3`, file at `server/data/iovault.db` (git-ignored, auto-created on first run; `server/db.js` runs `CREATE TABLE IF NOT EXISTS`). No manual DB setup needed. Override path with `DATABASE_FILE`.
- Tables: `users` (id, email, password_hash) and `workspaces` (user_id, data = full `VaultState` JSON, updated_at). See `docs/architecture.md`.
- Auth: `server/auth.js` — bcrypt hashing + JWT. `JWT_SECRET` is optional locally (a dev fallback is used); set it in prod. Frontend stores the token in `localStorage` under `io-vault-token`.
- To reset all accounts/data locally, delete `server/data/` and restart the API.

### Running
- `npm run dev` starts both Vite + Express together (via `concurrently`). Use `npm run dev:web` for frontend-only.
- The Vite dev server proxies `/api/*` to `http://localhost:8787` (see `vite.config.ts`), so run the full `npm run dev` if you need the API reachable from the browser.

### AI / secrets (optional)
- The API reads `OPENAI_API_KEY` from `.env.local` (preferred) or `.env` — both git-ignored. `server/index.js` loads `.env.local` with override, then `.env`. A `process.env.OPENAI_API_KEY` (e.g. a Cursor Secret) also works with no file. Without a key, `POST /api/agent` returns HTTP 400 `"Missing OPENAI_API_KEY in .env.local."` — expected, not a bug. The frontend has an offline fallback for greetings/time/date/simple math.
- Model is hardcoded to `gpt-4o-mini`.
- GOTCHA: the Express API reads the key once at startup (`const apiKey = process.env.OPENAI_API_KEY`) and does NOT watch env files. Under `npm run dev`, editing `.env`/`.env.local` triggers a **Vite** restart but NOT a restart of the `node server/index.js` process — so the new key is ignored until you restart the whole `npm run dev` command (or the API process). After adding a key, restart dev and confirm the log shows `injected env (1) from .env` (count > 0).

### Lint / typecheck / build
- There is no dedicated lint script. Type checking happens via `tsc -b` as part of `npm run build` (`tsc -b && vite build`). Use `npm run build` as the typecheck + build gate.
- No automated test suite exists in this repo.

### Gotchas
- App state lives entirely in `localStorage` under the key `io-vault-workspace`. To reset to first-run defaults, clear that key in the browser.
- First screen is an "Unlock" landing page; click **Unlock** to enter the workspace.
