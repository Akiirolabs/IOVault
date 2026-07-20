# Fix Attempts (Append Only)

## 2026-07-19 — DBG-1001

- Hypothesis: `/api/agent` can be called without a JWT and can consume OpenAI credits anonymously.
- Evidence: the route in `server/index.js` omitted `requireAuth`; `requestAgent` in `src/App.tsx` used raw `fetch`.
- Files changed: server AI security, database, API route, frontend request, tests, and debug documentation.
- Fix selected: layered security with authentication, fixed-window per-user/IP limits, bounded payloads, provider timeout, generic errors, and metadata-only usage auditing.
- Commands: `npm test`; `npm run build`.
- Result: successful; 7 test files and 15 tests passed, and the production TypeScript/Vite build passed.
- Pros: anonymous access is blocked and provider use is attributable without saving private content.
- Cons: rate state resets on restart and is not shared across server instances.
- New risks: thresholds may need tuning; full vault context still reaches OpenAI for authenticated requests.
- Follow-up: address DBG-1002 and broader DBG-1005 controls.
