# Issue Register

| Code | Problem | Verified | Status | Priority | Primary files | Best fix | Likely next fix |
|---|---|---:|---|---|---|---|---|
| DBG-1001 | Unauthenticated AI endpoint | Yes | Verified | Critical | `server/index.js`, `src/App.tsx` | Auth, limits, timeout, audit | Minimize context; then quotas |
| DBG-1002 | Entire vault sent to OpenAI | Yes | Confirmed | Critical | `src/App.tsx`, `server/index.js` | Selected/retrieved context only | Define context-selection UX |
| DBG-1003 | JWT in localStorage | Yes | Confirmed | Critical | `src/App.tsx`, `server/auth.js` | HttpOnly secure cookie | Design CSRF handling |
| DBG-1004 | Production JWT fallback | Yes | Confirmed | Critical | `server/auth.js` | Fail production startup | Secret rotation policy |
| DBG-1005 | Incomplete rate limiting | Yes | Planned | Critical | `server/index.js`, `server/ai-security.js` | Endpoint-specific persistent quotas | Protect auth and GitHub routes |
| DBG-1006 | Workspace JSON blob | Yes | Confirmed | High | `server/db.js` | Incremental normalization | Inventory record boundaries |
| DBG-1007 | Conflict-unsafe sync | Yes | Confirmed | High | `server/db.js`, `server/index.js` | Optimistic version checks | Add 409 merge UX |
| DBG-1008 | App component monolith | Yes | Confirmed | Medium | `src/App.tsx` | Extract bounded features | Characterization tests |
| DBG-1009 | Server monolith | Yes | Confirmed | Medium | `server/index.js` | Routers/services | Extract AI router first |
| DBG-1010 | Rich-text sanitization | Partial | Confirmed | High | `src/App.tsx` | Sanitize on input/render | Trace every HTML sink |
| DBG-1011 | Input validation | Yes | Confirmed | High | `server/index.js` | Route schemas and shared errors | Inventory route contracts |
| DBG-1012 | Dependency pinning | Yes | Confirmed | Medium | `package.json` | Pin intentional versions | Define update cadence |
| DBG-1013 | Package separation | Yes | Confirmed | Low | `package.json` | Split only when deployment needs it | Document runtime boundaries |
| DBG-1014 | Monaco/React state pressure | Partial | Confirmed | Medium | `src/codeVault/CodeVaultWorkspace.tsx` | Keep file bodies out of broad React state | Profile realistic repositories |
