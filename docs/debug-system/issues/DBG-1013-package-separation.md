# DBG-1013 — Package Separation

| Field | Detail |
|---|---|
| Status | **Confirmed architecture limitation** · Low · 2026-07-19 |
| Evidence | One root `package.json` owns browser, API, database, test, and build dependencies |
| Impact | Coupled installs, upgrades, ownership, and deployment boundaries |
| Fix | Split workspaces only after runtime modules and shared types have stable boundaries |
| Verify | Clean workspace install plus frontend/API test and build matrix |
| Tradeoffs | Independent ownership; more configuration and cross-package versioning |
| Next | Modularize frontend/server first; defer package split until justified |
