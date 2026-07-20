# DBG-1009 — Server Monolith

- **Status / priority / last updated:** Confirmed; Medium; 2026-07-19.
- **Repository evidence:** `server/index.js` is 429 lines and owns auth, vault, general AI, GitHub, scratch, patch, and publishing routes.
- **What is wrong / affected services and files:** Middleware ordering and service concerns are coupled in one Express entrypoint.
- **Impact:** Reliability, security-review, and test-isolation cost; minor direct runtime impact.
- **Best fix / why / example:** Extract routers and injected services while retaining one composition root.
- **Implementation plan / dependencies:** Add route characterization, extract AI first, then Code Vault and auth/vault routers.
- **Fixes attempted:** Supporting database, GitHub, and AI-security modules already exist.
- **Verification commands / results:** Needs full Supertest route matrix and build after each extraction.
- **Pros / cons:** Clear ownership and mocking; more module interfaces and imports.
- **Risks / rollback:** Middleware order/auth regression; keep composition changes small.
- **Likely next fix / final outcome:** Extract the now-tested AI route; unresolved.
