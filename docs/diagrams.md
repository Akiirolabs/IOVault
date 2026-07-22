# Current Product Diagrams

These diagrams summarize navigation and data flow. Detailed Code Vault diagrams live in [code-vault-architecture.md](code-vault-architecture.md).

> **Legacy reference diagrams — preserved unchanged.** The original navigation, persistence, and AI diagrams below remain as a historical product baseline. New implementation-system diagrams are added after them.

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

The server establishes an HttpOnly SameSite cookie at login; unsafe browser requests also carry `X-IOVault-CSRF: 1`.

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

## Current implementation-system map

```mermaid
flowchart LR
  Ideas["Product improvements"] --> Roadmap["Roadmap priority"]
  Bugs["Verified debug findings"] --> Roadmap
  Roadmap --> Register["IMP register"]
  Register --> Plans["Area implementation plans"]
  Plans --> Work["Code and documentation run"]
  Work --> Gates["Relevant verification gates"]
  Gates --> History["Append-only run evidence"]
  History --> Delivery["Delivery status"]
  Delivery --> Register
```

## Current page-improvement map

```mermaid
flowchart TB
  Foundation["Security, data sync, quality"] --> Modules["UI and API modularization"]
  Modules --> Notes["Notes / Write hierarchy and collections"]
  Modules --> Code["Code Vault profiling and acceptance"]
  Notes --> Projects["Project tables, flowcharts, mindmaps"]
  Notes --> Learning["Learning records and progress"]
  Notes --> Career["Career evidence and applications"]
  Projects --> Learning
  Projects --> Career
```

Detailed current maps live under [implementation-system/graphs](implementation-system/graphs/implementation-map.md). The legacy Mermaid blocks above are intentionally retained rather than rewritten.

Notes pages and collections still follow the preserved workspace persistence flow above: changes update `VaultState`, cache locally, and sync through `/api/vault`. No legacy Mermaid block was changed for IMP-1003.
