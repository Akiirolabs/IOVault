# Current State

| Layer | Current behavior | Main risk |
|---|---|---|
| Browser | React SPA; JWT and offline vault cache in localStorage | DBG-1003, DBG-1010 |
| API | Express auth, vault, AI, and GitHub routes | DBG-1005, DBG-1009, DBG-1011 |
| Data | Full VaultState stored as SQLite JSON; Code Vault has dedicated records and IndexedDB cache | DBG-1006, DBG-1007 |
| AI | General assistant is authenticated, bounded, throttled, timed out, and audited | Full vault context remains: DBG-1002 |
