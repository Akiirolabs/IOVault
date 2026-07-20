# DBG-1005 — Incomplete Rate Limiting

| Field | Detail |
|---|---|
| Status | **Planned** · Critical · 2026-07-19 |
| Evidence | Only `/api/agent` uses `server/ai-security.js`; auth, GitHub, vault, and code routes lack quotas |
| Impact | Brute force, flooding, provider cost, and availability risk |
| Fix | Route-specific IP/user quotas, concurrency/body limits, and shared counters when distributed |
| Verify | Threshold, isolation, expiry, concurrency, and `Retry-After` tests per route |
| Tradeoffs | Reduces abuse; bad thresholds can block legitimate users |
| Next | Protect login/signup, then GitHub and code-assistant routes |
