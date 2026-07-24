# Issue Register

`✅ Verified` means implementation, required tests, and the production build passed. Other statuses remain open.

| Code | Priority · Status | Problem | Primary path | Next action |
|---|---|---|---|---|
| DBG-1001 | Critical · **✅ Verified** | Anonymous AI endpoint | `server/index.js` | Minimize context |
| DBG-1002 | Critical · **✅ Verified** | Full vault sent to OpenAI | `src/App.tsx` | Monitor context quality |
| DBG-1003 | Critical · **✅ Verified** | JWT in localStorage | `src/App.tsx` | Monitor cookie sessions |
| DBG-1004 | Critical · Planned | Production JWT fallback | `server/auth.js` | Fail closed in production |
| DBG-1005 | Critical · Planned | Incomplete rate limits | `server/index.js` | Protect auth routes |
| DBG-1006 | High · Planned | Workspace JSON blob | `server/db.js` | Define record boundaries |
| DBG-1007 | High · Planned | Conflict-unsafe sync | `server/db.js` | Add expected version + 409 |
| DBG-1010 | High · Planned | Rich-text sanitization | `src/App.tsx` | Trace HTML sinks |
| DBG-1011 | High · Planned | Inconsistent validation | `server/index.js` | Inventory route contracts |
| DBG-1008 | Medium · Planned | Frontend monolith | `src/App.tsx` | Add characterization tests |
| DBG-1009 | Medium · Planned | Server monolith | `server/index.js` | Extract AI router |
| DBG-1012 | Medium · Planned | Dependency drift | `package.json` | Define pin/update policy |
| DBG-1014 | Medium · Planned | Editor state pressure | `src/codeVault/CodeVaultWorkspace.tsx` | Profile realistic repository |
| DBG-1013 | Low · Planned | Single package boundary | `package.json` | Defer until justified |
