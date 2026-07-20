# DBG-1005 — Incomplete Rate Limiting

- **Status / priority / last updated:** Planned; Critical; 2026-07-19.
- **Repository evidence:** `server/index.js` exposes auth, GitHub, vault, and AI routes; only `/api/agent` now uses `server/ai-security.js`.
- **What is wrong / affected services and files:** Other expensive or brute-force-sensitive routes have no quotas; API, auth, AI, and GitHub are affected.
- **Impact:** Credential attacks, API flooding, provider cost, and availability loss; limiter tuning also affects legitimate performance.
- **Best fix / why / example:** Endpoint-specific IP/user quotas, concurrency and body limits, with shared state for multiple instances and `Retry-After` responses.
- **Implementation plan / dependencies:** Measure traffic, protect login/signup first, then GitHub/code AI, and move counters to shared persistence before scaling.
- **Fixes attempted:** DBG-1001 added the single-process `/api/agent` layer.
- **Verification commands / results:** AI limiter tests pass; system-wide behavior needs implementation.
- **Pros / cons:** Reduces abuse; false positives and distributed state add operational complexity.
- **Risks / rollback:** Account lockout or proxy IP aggregation; tune per route and support exemptions carefully.
- **Likely next fix / final outcome:** Protect authentication routes; partially addressed only.
