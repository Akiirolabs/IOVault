# Current State

| Layer | Current behavior | Main risk |
|---|---|---|
| Browser | React SPA; HttpOnly cookie session; offline vault cache in localStorage | DBG-1010 |
| API | Express auth, vault, AI, and GitHub routes | DBG-1005, DBG-1009, DBG-1011 |
| Data | Full VaultState stored as SQLite JSON; Code Vault has dedicated records and IndexedDB cache | DBG-1006, DBG-1007 |
| AI | Authenticated and bounded; no context by default; optional active-page summary only | Context relevance requires monitoring |
