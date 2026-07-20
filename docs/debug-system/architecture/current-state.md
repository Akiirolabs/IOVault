# Current State

The React SPA stores its bearer JWT and an offline workspace cache in browser localStorage. `src/App.tsx` loads and saves a complete VaultState through Express. Express authenticates most data and Code Vault routes, persists the workspace as SQLite JSON, and calls OpenAI for the general and coding assistants. Code Vault also uses IndexedDB for bounded file caching and optional GitHub App endpoints.

DBG-1001 now inserts auth, validation, throttling, timeout handling, and metadata-only auditing before and around the general OpenAI call. The authenticated request still contains the complete VaultState, tracked separately as DBG-1002.
