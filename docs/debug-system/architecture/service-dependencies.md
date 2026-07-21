# Service Dependencies

| Service | Depends on | Risk-bearing data |
|---|---|---|
| React frontend | Browser storage, Express API | VaultState and editor buffers; session cookie is inaccessible to JS |
| Authentication | JWT secret, users table | credentials and session claims |
| Vault sync | `/api/vault`, workspaces table | full VaultState JSON |
| General assistant | auth, limiter, OpenAI, usage audit | message and current vault context |
| Code Vault | IndexedDB, code API, GitHub App, OpenAI | selected files, patches, installation metadata |
| Build/CI | package manifest and lockfile | dependency integrity |
