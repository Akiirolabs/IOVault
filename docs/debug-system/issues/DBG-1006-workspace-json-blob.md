# DBG-1006 — Workspace Stored as One JSON Blob

| Field | Detail |
|---|---|
| Status | **Planned** · High · 2026-07-19 |
| Evidence | `server/db.js` stores and rewrites complete `workspaces.data` TEXT |
| Impact | Coarse queries/history/permissions, larger writes, difficult recovery and migration |
| Fix | Incrementally normalize high-value entities with user IDs and versions |
| Verify | Dual-write parity, backfill, rollback, migration, and performance tests |
| Tradeoffs | Better recovery and queries; significant migration/repository complexity |
| Next | Implement DBG-1007 versioning before normalization |
