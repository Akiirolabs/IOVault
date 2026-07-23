# IO Vault Debug System

| Start here | Purpose |
|---|---|
| [Issue register](issue-register.md) | Priority, status, owner paths, and next action |
| [Fix attempts](fix-attempts.md) | Append-only implementation history |
| [Verification matrix](verification-matrix.md) | Tests and acceptance evidence |
| [Service impact](service-impact-chart.md) | Cross-system blast radius |
| [Issue details](issues/) | One compact technical record per debug code |
| [Risk graphs](graphs/) | Sensitive data flow and fix order |
| [Templates](templates.md) | Issue, attempt, and verification records |

**Rule:** verify against current code, record real evidence, never store secrets or vault content, and use `Verified` only after tests and build pass.
