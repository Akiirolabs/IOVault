# DBG-1004 — Production JWT Secret Fallback

- **Status / priority / last updated:** Confirmed; Critical; 2026-07-19.
- **Repository evidence:** `server/auth.js` falls back to the literal `iovault-dev-secret-change-me` without checking `NODE_ENV`.
- **What is wrong / affected services and files:** Production can sign predictable tokens if configuration is absent; authentication is affected.
- **Impact:** Critical authentication forgery and data-access risk; startup reliability becomes preferable to insecure availability.
- **Best fix / why / example:** Throw during production startup when `JWT_SECRET` is missing because no secure runtime fallback exists.
- **Implementation plan / dependencies:** Central environment validation, deployment secret provisioning, and documented rotation.
- **Fixes attempted:** None.
- **Verification commands / results:** Needs child-process startup tests for production failure and development fallback.
- **Pros / cons:** Prevents predictable tokens; deployment fails when secret management is broken.
- **Risks / rollback:** Production outage on misconfiguration; rollback only after supplying a secure secret.
- **Likely next fix / final outcome:** Add environment validation before cookie-session work; unresolved.
