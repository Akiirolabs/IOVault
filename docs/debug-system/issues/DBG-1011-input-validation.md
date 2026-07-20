# DBG-1011 — Inconsistent Input Validation

- **Status / priority / last updated:** Confirmed; High; 2026-07-19.
- **Repository evidence:** `server/index.js` performs route-specific manual checks; no shared schema layer exists. DBG-1001 adds focused `validateAgentRequest` only.
- **What is wrong / affected services and files:** Validation shape, bounds, and error behavior vary across API routes.
- **Impact:** Security, integrity, reliability, and resource-consumption risk across auth, vault, AI, and GitHub.
- **Best fix / why / example:** Shared schemas at route boundaries with typed normalized outputs and consistent errors.
- **Implementation plan / dependencies:** Inventory contracts, prioritize write/expensive routes, introduce schemas without altering successful responses.
- **Fixes attempted:** Agent and several Code Vault paths have targeted manual validation.
- **Verification commands / results:** DBG-1001 boundaries pass; global matrix needs implementation.
- **Pros / cons:** Predictable contracts; dependency and migration overhead.
- **Risks / rollback:** Previously accepted payloads may fail; document compatibility changes.
- **Likely next fix / final outcome:** Validate auth and vault writes next; partially addressed.
