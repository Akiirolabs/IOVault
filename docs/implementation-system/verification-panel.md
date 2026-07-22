# Verification Panel

The screenshot-inspired panel is adapted to commands that actually exist in this repository.

| Gate | State | What it checks | Command / evidence |
|---|---|---|---|
| Frontend types + build | Available | TypeScript and production bundle | `npm run build` |
| Unit and component behavior | Available | Utilities and React interactions | `npm test` |
| Backend routes and errors | Available | Express APIs through Supertest | `npm test` |
| Full local product | Manual | Vite and API start together | `npm run dev` |
| API-only startup | Manual | Express starts on port 8787 | `npm run dev:api` |
| Dependency review | On demand | Known dependency advisories | `npm audit` |
| Browser end-to-end | Planned | Complete signed-in workflows | No Playwright gate configured |
| Code style | Planned | Consistent lint rules | No lint script configured |
| API health | Planned | Deployment health/readiness | No health endpoint configured |
| Database schema | Partial | Tables initialize and API tests use SQLite | No dedicated schema command |
| Migration status | Planned | Applied versioned migrations | No migration runner configured |
| Performance budget | Planned | Large workspace and repository behavior | No benchmark gate configured |

Do not check a row complete because its command exists. Add dated evidence to the relevant area plan and [implementation runs](implementation-runs.md).

## Current feature evidence

| Date | Code | Result | Evidence |
|---|---|---|---|
| 2026-07-22 | IMP-1003 | Implemented v1 | 27 tests; production build; signed-in browser smoke check with zero console errors |
