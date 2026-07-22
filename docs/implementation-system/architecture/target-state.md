# Target Product Boundaries

```mermaid
flowchart TB
  Shell["Accessible application shell"] --> Notes["Notes / Write"]
  Shell --> Projects["Projects"]
  Shell --> Code["Code Vault"]
  Shell --> Learning["Learning"]
  Shell --> Career["Career"]
  Notes & Projects & Learning & Career --> Workspace["Versioned workspace services"]
  Code --> CodeData["Bounded repository and scratch services"]
  Workspace & CodeData --> API["Validated modular API"]
  API --> SQL["User-scoped SQLite records"]
  API --> Integrations["Short-lived external integrations"]
  Quality["Automated quality gates"] -. verifies .-> Shell
  Quality -. verifies .-> API
```

The target keeps each page independently testable, shares structured content primitives deliberately, and avoids turning every feature into a larger workspace JSON blob.

