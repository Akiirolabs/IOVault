# Verification Matrix

| Code | Security behavior | Automated evidence | Build | Outcome |
|---|---|---|---|---|
| DBG-1001 | Anonymous/invalid JWT rejected; payload bounded; user/IP throttled; timeout and upstream failures mapped; audit excludes content | `server/index.test.js`, `server/ai-security.test.js`, `src/App.api.test.ts` | Passed | Verified: 15 tests and production build passed |

Acceptance requires `npm test` and `npm run build` to pass in the same implementation state.
