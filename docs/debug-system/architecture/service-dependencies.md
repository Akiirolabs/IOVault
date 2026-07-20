# Service Dependencies

| Service | Depends on | Risk-bearing data |
|---|---|---|
| React frontend | Browser storage, Express API | JWT, VaultState, editor buffers |
| Authentication | JWT secret, users table | credentials and session claims |
| Vault sync | `/api/vault`, workspaces table | full VaultState JSON |
| General assistant | auth, limiter, OpenAI, usage audit | message and current vault context |
| Code Vault | IndexedDB, code API, GitHub App, OpenAI | selected files, patches, installation metadata |
| Build/CI | package manifest and lockfile | dependency integrity |
