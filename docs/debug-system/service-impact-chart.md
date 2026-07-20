# Service Impact Chart

| Debug Code | Problem | Frontend | API | Auth | AI | Database | Sync | GitHub | Build/CI | Security | Performance | Primary Files |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DBG-1001 | Anonymous AI use | Direct | Direct | Direct | Direct | Direct | None | None | Indirect | Direct | Indirect | `src/App.tsx`; `server/index.js`; `server/db.js` |
| DBG-1002 | Full vault AI context | Direct | Direct | Indirect | Direct | None | None | None | Indirect | Direct | Direct | `src/App.tsx`; `server/index.js` |
| DBG-1003 | JWT in localStorage | Direct | Indirect | Direct | Indirect | None | None | None | Indirect | Direct | None | `src/App.tsx`; `server/auth.js` |
| DBG-1004 | JWT fallback | None | Direct | Direct | None | None | None | None | Direct | Direct | None | `server/auth.js` |
| DBG-1005 | Incomplete limits | Indirect | Direct | Direct | Direct | None | None | Direct | Indirect | Direct | Direct | `server/index.js`; `server/ai-security.js` |
| DBG-1006 | JSON workspace | Direct | Direct | Indirect | Indirect | Direct | Direct | None | Indirect | Indirect | Direct | `server/db.js` |
| DBG-1007 | Last-write-wins | Direct | Direct | Indirect | None | Direct | Direct | None | Indirect | Indirect | Direct | `server/db.js`; `server/index.js` |
| DBG-1008 | Frontend monolith | Direct | None | Indirect | Indirect | None | Indirect | Indirect | Direct | Indirect | Direct | `src/App.tsx` |
| DBG-1009 | Server monolith | None | Direct | Direct | Direct | Direct | Direct | Direct | Direct | Indirect | Indirect | `server/index.js` |
| DBG-1010 | Unsanitized rich text | Direct | Indirect | Indirect | Indirect | Indirect | None | None | Indirect | Direct | Indirect | `src/App.tsx` |
| DBG-1011 | Inconsistent validation | Direct | Direct | Direct | Direct | Direct | Indirect | Direct | Indirect | Direct | Direct | `server/index.js` |
| DBG-1012 | Version ranges/latest | Indirect | Indirect | Indirect | Indirect | Indirect | None | Indirect | Direct | Direct | Indirect | `package.json` |
| DBG-1013 | Single package boundary | Indirect | Direct | Indirect | Indirect | Indirect | None | Indirect | Direct | None | Indirect | `package.json` |
| DBG-1014 | Editor state pressure | Direct | None | None | Indirect | None | None | Indirect | Indirect | None | Direct | `src/codeVault/CodeVaultWorkspace.tsx` |
