# DBG-1007 — Conflict-Unsafe Synchronization

| Field | Detail |
|---|---|
| Status | **Confirmed** · High · 2026-07-19 |
| Evidence | Workspace upsert overwrites by user ID; `/api/vault` PUT accepts no expected version |
| Impact | Concurrent clients can silently lose newer data |
| Fix | Integer workspace version + conditional update + HTTP 409 merge/reload UX |
| Verify | Two-client race and stale-version Supertest cases |
| Tradeoffs | Prevents silent overwrite; users need a clear conflict path |
| Next | Add versioned API contract, then normalize records |
