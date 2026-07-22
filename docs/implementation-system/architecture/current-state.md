# Current Product Boundaries

```mermaid
flowchart LR
  User["Signed-in user"] --> App["React workspace: five pages"]
  App --> Cache["localStorage offline VaultState cache"]
  App --> API["Express API"]
  API --> DB["SQLite users, workspace, code, audit"]
  App --> IDB["IndexedDB Code Vault cache"]
  API --> OpenAI["OpenAI"]
  API --> GitHub["GitHub App"]
```

The five primary workspaces are Code Vault, Write, Learning, Career, and Projects. Most page state still travels inside one `VaultState` JSON document; Code Vault repository bodies and scratch infrastructure use dedicated storage.

