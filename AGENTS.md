# Progress Command Center (IO Vault)

Personal productivity dashboard: a Vite + React + TypeScript single-page app with a small Express API for optional AI features. All workspace data persists client-side in browser `localStorage` (no database).

## Cursor Cloud specific instructions

### Services
- Frontend (Vite dev server): `http://localhost:5173` — this IS the product; required to run/test anything.
- API (Express, `server/index.js`): `http://localhost:8787` — OPTIONAL. Only powers AI features (the "Agent" drawer and Career "AI Revise"). The dashboard, all page editors, and localStorage persistence work fully without it.

### Running
- `npm run dev` starts both Vite + Express together (via `concurrently`). Use `npm run dev:web` for frontend-only.
- The Vite dev server proxies `/api/*` to `http://localhost:8787` (see `vite.config.ts`), so run the full `npm run dev` if you need the API reachable from the browser.

### AI / secrets (optional)
- The API reads `OPENAI_API_KEY` from `.env.local` (git-ignored). Without it, `POST /api/agent` returns HTTP 400 with `"Missing OPENAI_API_KEY in .env.local."` — this is expected, not a bug. The frontend has an offline fallback for greetings/time/date/simple math when the API is unavailable.
- To enable real AI responses, create `.env.local` with `OPENAI_API_KEY=...` (model is hardcoded to `gpt-4o-mini`).

### Lint / typecheck / build
- There is no dedicated lint script. Type checking happens via `tsc -b` as part of `npm run build` (`tsc -b && vite build`). Use `npm run build` as the typecheck + build gate.
- No automated test suite exists in this repo.

### Gotchas
- App state lives entirely in `localStorage` under the key `io-vault-workspace`. To reset to first-run defaults, clear that key in the browser.
- First screen is an "Unlock" landing page; click **Unlock** to enter the workspace.
