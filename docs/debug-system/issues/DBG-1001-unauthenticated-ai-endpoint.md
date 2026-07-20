# DBG-1001 — Unauthenticated AI Assistant Endpoint

- **Status / priority / last updated:** Verified; Critical; 2026-07-19.
- **Repository evidence:** `/api/agent` in `server/index.js` previously omitted `requireAuth`, and `requestAgent` in `src/App.tsx` used unauthenticated `fetch`.
- **What is wrong:** Anonymous callers could spend API credits. Affected services/files: frontend, authentication, Express, OpenAI, SQLite; `src/App.tsx`, `server/index.js`, `server/db.js`.
- **Impact:** Critical security/cost reliability exposure; potentially high provider load. Privacy impact is indirect because anonymous callers did not automatically receive another user's vault.
- **Best fix / why:** Authenticate before validation/provider checks, limit user and IP traffic, bound payloads, time out upstream work, and audit metadata. This closes the abuse path with the smallest complete layer.
- **Example fix / plan:** `app.post("/api/agent", requireAuth, aiRateLimiter.middleware, handler)` plus authenticated frontend fetch, 8,000-character/512-KB bounds, and 30-second client timeout.
- **Dependencies / prerequisites:** Existing JWT middleware and SQLite; no new package. In-memory counters assume one API process.
- **Fixes attempted:** 2026-07-19 layered implementation; see `fix-attempts.md`.
- **Verification commands / results:** `npm test` passed 7 files and 15 tests; `npm run build` passed.
- **Pros:** Blocks anonymous calls, produces attributable privacy-safe usage metadata, and returns stable errors.
- **Cons:** Counters reset on restart; no monetary quota; authenticated requests still send full vault context.
- **Risks / rollback:** Thresholds can throttle valid bursts. Roll back the limiter independently, but retain authentication.
- **Likely next fix:** DBG-1002 context minimization, then persistent DBG-1005 quotas.
- **Final outcome:** Verified. Anonymous AI use is blocked and the documented security boundaries pass automated checks.
