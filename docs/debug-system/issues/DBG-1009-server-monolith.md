# DBG-1009 — Server Monolith

| Field | Detail |
|---|---|
| Status | **Confirmed** · Medium · 2026-07-19 |
| Evidence | `server/index.js` combines auth, vault, AI, GitHub, scratch, patch, and publish routes |
| Impact | Coupled middleware order, security review, and test isolation |
| Fix | Keep one composition root; extract injected routers/services by domain |
| Verify | Full Supertest route matrix and build after each extraction |
| Tradeoffs | Better ownership; more module interfaces and middleware-order risk |
| Next | Extract the already-tested AI router first |
