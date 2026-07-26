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
| 2026-07-25 | FTR-IMP-1004 · FTR-1001.3/.4/.4.1/.5/.6/.7 · IMP-1001 | ✅ Verified | 44 tests; production build; signed-in browser confirmed 14 formatting controls, hierarchy collapse/expand, and keyboard moves |
| 2026-07-24 | FTR-IMP-1003 · FTR-1002 · IMP-1001 | ✅ Verified | 38 tests; production build; signed-in browser confirmed foreground six-pixel menu anchoring, unchanged active page, and template choices |
| 2026-07-24 | IMP-1001 page actions | ✅ Verified | 35 tests; production build; signed-in browser check of all six parent-scoped menu actions |
| 2026-07-24 | DOC-1011 · IMP-1004/1005 | Design updated | Agent roles, data, autonomy policies, platform feasibility, delivery phases, limits, and acceptance synchronized |
| 2026-07-24 | FTR-IMP-1002 · FTR-1001.2 · IMP-1001 | ✅ Verified | 32 tests; production build; signed-in visual acceptance of `+` placement and clear `×` controls; temporary row removed |
| 2026-07-24 | FTR-IMP-1001 · FTR-1001.1 · IMP-1001 | ✅ Verified | 32 tests; production build; signed-in create/edit/collapse/reload/expand acceptance; temporary test row removed |
| 2026-07-24 | FTR-1001 · TEST-IV-1001 · IMP-1001 | Audit recorded | Eight manual findings transcribed as `FTR-1001.1` through `.7`, including `.4.1`; two verified and six remain planned |
| 2026-07-23 | DBG-IMP-1004 · IMP-1001 | ✅ Verified | 30 tests; production build; signed-in typed-column create/edit/save/reload; zero prompt errors |
| 2026-07-23 | ADT-1001 · IMP-1001 | Corrections required | Live `+ Column` failure; source/type/persistence/security/test audit; 7 Notes tests and build passed |
| 2026-07-22 | IMP-1001 | Implemented v1 | 27 tests; production build; signed-in browser smoke check with zero console errors |
