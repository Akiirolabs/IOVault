# DBG-1007 — Conflict-Unsafe Synchronization

- **Status / priority / last updated:** Confirmed; High; 2026-07-19.
- **Repository evidence:** `upsertWorkspace` in `server/db.js` overwrites by `user_id`; `/api/vault` PUT in `server/index.js` accepts no expected version.
- **What is wrong / affected services and files:** Concurrent clients silently overwrite newer workspace state; sync, API, database, and frontend are affected.
- **Impact:** Reliability and data-loss risk with indirect privacy/integrity effects; retries can amplify writes.
- **Best fix / why / example:** Optimistic concurrency with an integer version and HTTP 409 on mismatch prevents silent loss.
- **Implementation plan / dependencies:** Schema migration, version in GET/PUT contracts, conditional update, and merge/reload UI.
- **Fixes attempted:** None.
- **Verification commands / results:** Needs two-client race and stale-version Supertest coverage.
- **Pros / cons:** Detects conflicts; requires a clear user merge path.
- **Risks / rollback:** Excess conflicts during migration; temporarily accept missing versions only in a defined compatibility window.
- **Likely next fix / final outcome:** Add versioned contract before normalization; unresolved.
