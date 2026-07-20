# Verification Matrix

| Code | Auth | Limits | Failure mapping | Privacy audit | Tests | Build | Status |
|---|---|---|---|---|---|---|---|
| DBG-1001 | Pass | Pass | Pass | Pass | 15 passed | Pass | **Verified** |
| DBG-1002 | Pass | 64 KB selected context | Pass | Non-selected data excluded | 17 passed | Pass | **Verified** |

Evidence: `server/index.test.js`, `server/ai-security.test.js`, `src/App.api.test.ts`. Acceptance always requires `npm test` and `npm run build` on the same state.
