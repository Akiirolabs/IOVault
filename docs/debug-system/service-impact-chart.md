# Service Impact

| Code | Direct impact | Secondary impact | Primary path |
|---|---|---|---|
| DBG-1001 | API, Auth, AI | Frontend, Database | `server/index.js` |
| DBG-1002 | Frontend, AI | API, Security, Performance | `src/App.tsx` |
| DBG-1003 | Frontend, Auth | Every authenticated service | `src/App.tsx` |
| DBG-1004 | Auth, API | Build/deployment | `server/auth.js` |
| DBG-1005 | API, Auth, AI, GitHub | Security, Performance | `server/index.js` |
| DBG-1006 | Database, Sync | API, Performance | `server/db.js` |
| DBG-1007 | Sync, Database | Frontend, Reliability | `server/db.js` |
| DBG-1008 | Frontend | Build, Performance | `src/App.tsx` |
| DBG-1009 | API | Auth, AI, Database, GitHub | `server/index.js` |
| DBG-1010 | Rich text, Frontend | Auth, Browser storage | `src/App.tsx` |
| DBG-1011 | API validation | All write/expensive routes | `server/index.js` |
| DBG-1012 | Build/CI | All runtime services | `package.json` |
| DBG-1013 | Build/package layout | Frontend, API | `package.json` |
| DBG-1014 | Monaco, Frontend | IndexedDB, Performance | `src/codeVault/CodeVaultWorkspace.tsx` |

See [issue-service graph](graphs/issue-service-graph.md) for the visual relationship map.
