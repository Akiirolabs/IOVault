# DBG-1006 — Workspace Stored as One JSON Blob

- **Status / priority / last updated:** Confirmed; High; 2026-07-19.
- **Repository evidence:** `workspaces.data` is TEXT and `saveWorkspace` serializes the complete object in `server/db.js`.
- **What is wrong / affected services and files:** Every save rewrites the workspace; database, synchronization, API, and recovery are affected.
- **Impact:** Coarse permissions/history, difficult migrations, larger writes, and weak record recovery; privacy isolation remains user-level only.
- **Best fix / why / example:** Incrementally normalize high-value entities with user IDs and versions to enable safe queries and migration.
- **Implementation plan / dependencies:** Inventory documents/projects/snippets, add dual-read/write migration, backfill, verify, then retire fields.
- **Fixes attempted:** Code Vault already uses dedicated tables; general VaultState remains a blob.
- **Verification commands / results:** Needs migration, parity, rollback, and performance tests.
- **Pros / cons:** Better history and queries; substantially more repository and migration logic.
- **Risks / rollback:** Data loss or divergence; preserve the blob until parity is proven.
- **Likely next fix / final outcome:** Add optimistic workspace version first; unresolved.
