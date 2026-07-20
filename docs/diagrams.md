# Current Product Diagrams

These diagrams summarize navigation and data flow. Detailed Code Vault diagrams live in [code-vault-architecture.md](code-vault-architecture.md).

## Product navigation

```mermaid
flowchart TD
  Start["Open IO Vault"] --> Auth["Sign in / sign up"]
  Auth --> Unlock["Unlock workspace"]
  Unlock --> Shell["Dashboard shell"]
  Shell --> Agent["Global AI drawer"]
  Shell --> Code["Code Vault mini IDE"]
  Shell --> Write["Write"]
  Shell --> Learn["Learning"]
  Shell --> Career["Career"]
  Shell --> Projects["Projects"]
```

## Persistence flow

```mermaid
flowchart LR
  Edit["Workspace edit"] --> State["React VaultState"]
  State -->|"immediate cache"| Local[("localStorage")]
  State -->|"debounced authenticated save"| API["/api/vault"]
  API --> SQL[("SQLite workspace JSON")]
  CodeEdit["Code Vault edit"] --> Monaco["Monaco model"]
  Monaco --> IDB[("IndexedDB cache")]
  Monaco --> Scratch["SQLite scratch file"]
  Repo["GitHub file"] --> IDB
```

## General AI request

```mermaid
sequenceDiagram
  actor U as User
  participant R as React
  participant A as Authenticated /api/agent
  participant O as OpenAI
  U->>R: Ask question
  opt User enables current-page context
    R->>R: Build bounded active-page summary
  end
  R->>A: Message + optional selected context
  A->>A: Auth, rate limit, 8k/64KB validation
  A->>O: Minimal request
  O-->>A: Answer
  A-->>R: Answer + model
```

## Responsive policy

Desktop structure is preserved on narrow screens. A minimum-width workspace scrolls horizontally instead of stacking panels or converting the sidebar into a top rail.
