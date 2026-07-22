# DBG-1001 — Unauthenticated AI Endpoint

| Field | Detail |
|---|---|
| Status | **✅ Verified** · Critical · 2026-07-19 |
| Evidence | `/api/agent` lacked `requireAuth`; `src/App.tsx` used raw `fetch` |
| Impact | Anonymous API-credit use; unbounded provider load |
| Fix | Authenticated fetch + JWT middleware; 10/user/min, 30/IP/min; 8k prompt, 64 KB selected context; 30s timeout; content-free SQLite audit |
| Verify | 15 tests and production build passed |
| Tradeoffs | Limits reset per process; retain auth if limiter is rolled back |
| Next | DBG-1005 persistent quotas |
