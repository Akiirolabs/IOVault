# DBG-1003 — JWT Stored in localStorage

- **Status / priority / last updated:** Confirmed; Critical; 2026-07-19.
- **Repository evidence:** `tokenKey = "io-vault-token"` and `localStorage.getItem` appear in `src/App.tsx` and `src/codeVault/api.ts`.
- **What is wrong / affected services and files:** Browser JavaScript can read the bearer token; frontend, auth, and all authenticated APIs are affected.
- **Impact:** XSS can become account/session theft; privacy and integrity are critical, with little direct performance impact.
- **Best fix / why / example:** HttpOnly, Secure, SameSite session cookie so injected JavaScript cannot read it; `res.cookie("session", token, { httpOnly: true, secure, sameSite: "lax" })`.
- **Implementation plan / dependencies:** Design CSRF protection, migrate fetch credentials, session expiry, logout, and compatibility after DBG-1010.
- **Fixes attempted:** None.
- **Verification commands / results:** Needs cookie, CSRF, expiry, and logout integration tests.
- **Pros / cons:** Stronger token protection; cross-origin and CSRF behavior becomes more complex.
- **Risks / rollback:** Misconfigured cookies can break login; feature-flag a compatibility migration.
- **Likely next fix / final outcome:** Sanitize rich text, then migrate sessions; unresolved.
