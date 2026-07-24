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

Do not check a row complete because its command exists. Add dated evidence to the relevant area plan and [implementation log](../implementation-log.md).

## Current feature evidence

| Date | Code | Result | Evidence |
|---|---|---|---|
| 2026-07-24 | DBG-IMP-1007 · ADT-1002.1 · IMP-1003 | ✅ Verified | 32 tests; production build; signed-in create/edit/collapse/reload/expand acceptance; temporary test row removed |
| 2026-07-24 | ADT-1002 · TEST-IV-1001 · IMP-1003 | Audit recorded | Eight manual findings transcribed as `ADT-1002.1` through `.7`, including `.4.1`; one verified and seven remain planned |
| 2026-07-23 | DBG-IMP-1004 · IMP-1003 | ✅ Verified | 30 tests; production build; signed-in typed-column create/edit/save/reload; zero prompt errors |
| 2026-07-23 | ADT-1001 · IMP-1003 | Corrections required | Live `+ Column` failure; source/type/persistence/security/test audit; 7 Notes tests and build passed |
| 2026-07-22 | IMP-1003 | Implemented v1 | 27 tests; production build; signed-in browser smoke check with zero console errors |
