# DBG-1004 — Production JWT Secret Fallback

| Field | Detail |
|---|---|
| Status | **Planned** · Critical · 2026-07-19 |
| Evidence | `server/auth.js` falls back to `iovault-dev-secret-change-me` without a production guard |
| Impact | Predictable production signing key could allow forged sessions |
| Fix | Fail production startup without `JWT_SECRET`; add managed secret rotation |
| Verify | Production startup fails when absent; development fallback remains intentional |
| Tradeoffs | Secure failure mode; misconfigured deployment will not start |
| Next | Centralize environment validation before session migration |
