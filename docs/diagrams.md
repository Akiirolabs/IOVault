# Diagrams

These diagrams describe the current IO Vault implementation. Update them when routes, state ownership, storage, API contracts, or layout behavior change.

## App Flow

```mermaid
flowchart TD
  A["Open IO Vault"] --> B["Unlock screen"]
  B --> C{"User clicks Unlock?"}
  C -->|No| B
  C -->|Yes| D["Dashboard shell"]
  D --> E["Left workspace nav"]
  D --> F["Active workspace page"]
  D --> G["Global AI drawer"]
  E --> H["Code Vault"]
  E --> I["Write"]
  E --> J["Learning"]
  E --> K["Career"]
  E --> L["Projects"]
```

## Frontend State And Persistence

```mermaid
flowchart LR
  A["User edits UI"] --> B["Page-specific update function"]
  B --> C["saveVaultState reducer"]
  C --> D["React state"]
  C --> E["localStorage: io-vault-workspace"]
  E --> F["getSavedVaultState on next load"]
  F --> G["normalizeVaultState"]
  G --> D
```

## AI Request Flow

```mermaid
sequenceDiagram
  participant User
  participant React as React App
  participant API as Express /api/agent
  participant OpenAI

  User->>React: Ask question or request resume revision
  React->>API: POST message and vaultData
  API->>API: Validate message and OPENAI_API_KEY
  API->>OpenAI: Create chat completion
  OpenAI-->>API: Assistant response
  API-->>React: JSON answer and model
  React-->>User: Render answer or AI draft
```

## Component Layout

```mermaid
flowchart TD
  App["App.tsx"]
  App --> Home["Home screen"]
  App --> Dashboard["Dashboard shell"]
  App --> Agent["Global AI drawer"]
  Dashboard --> Nav["Workspace nav"]
  Dashboard --> Topline["Workspace header"]
  Dashboard --> Pages["Active page area"]
  Pages --> Code["Code Vault"]
  Pages --> Write["Write"]
  Pages --> Learning["Learning"]
  Pages --> Career["Career"]
  Pages --> Projects["Projects"]
```

## Responsive Layout Policy

```mermaid
flowchart LR
  A["Desktop viewport"] --> B["Left sticky nav"]
  A --> C["Two-column workspace grids"]
  A --> D["Project board keeps columns"]
  E["Mobile viewport"] --> B
  E --> C
  E --> D
  E --> F["Horizontal page scroll when viewport is narrower than 960px"]
```

## File Responsibility Map

```mermaid
flowchart TB
  main["src/main.tsx"] --> app["src/App.tsx"]
  app --> css["src/styles.css"]
  app --> aiConfig["src/aiConfig.ts"]
  app --> api["/api/agent"]
  api --> server["server/index.js"]
  server --> openai["OpenAI API"]
  app --> storage["localStorage"]
```
