# IO Vault Debug System

| Start here | Purpose |
|---|---|
| [Issue register](issue-register.md) | Priority, status, owner paths, and next action |
| [Implementation status](implementation-status.md) | What changed and whether it passed |
| [Fix attempts](fix-attempts.md) | Append-only implementation history |
| [Verification matrix](verification-matrix.md) | Tests and acceptance evidence |
| [Service impact](service-impact-chart.md) | Cross-system blast radius |
| [Issue details](issues/) | One compact technical record per debug code |
| [Architecture](architecture/) · [Graphs](graphs/) | System context, dependencies, and fix order |

**Rule:** verify against current code, record real evidence, never store secrets or vault content, and use `Verified` only after tests and build pass.
