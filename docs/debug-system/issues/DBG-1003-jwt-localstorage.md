# DBG-1003 — JWT Stored in localStorage

| Field | Detail |
|---|---|
| Status | **Confirmed** · Critical · 2026-07-19 |
| Evidence | `io-vault-token` is read from localStorage in `src/App.tsx` and `src/codeVault/api.ts` |
| Impact | XSS can steal a session and access private vault data |
| Fix | HttpOnly, Secure, SameSite session cookie with CSRF protection |
| Verify | Cookie visibility, CSRF, expiry, logout, and authenticated-route tests |
| Tradeoffs | Stronger token isolation; more cross-origin and CSRF complexity |
| Next | Complete DBG-1010 sanitization, then migrate sessions |
