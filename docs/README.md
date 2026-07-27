# IO Vault Documentation

IO Vault is a personal productivity platform that combines secure workspace management, structured writing, project planning, guided learning, career development, and a GitHub-backed coding environment. This documentation defines the deployed architecture, implementation roadmap, feature-review history, and security and system baselines for Version 1.0.

| Documentation area | Scope |
|---|---|
| [Deployment Ledger](deployment-ledger/README.md) | Complete-state chronology, Version 1.0, routing, and historical aliases |
| [DPL-1001](deployment-ledger/DPL-1001-pre-monaco-state.md) | Historical pre-Monaco baseline |
| [DPL-1002](deployment-ledger/DPL-1002-current-testing-state.md) | Current architecture, runtime, verification, and limitations |
| [DPL-1003](deployment-ledger/DPL-1003-next-testing-state.md) | Planned next complete testing state |
| [Implementation system](implementation-system/README.md) | Permanent IMP register, dependencies, and verification rules |
| [IMP-1001 Write](implementation-system/implementations/IMP-1001-write.md) | Numbered Write delivery and future rollouts |
| [IMP-1002 Code Vault](implementation-system/implementations/IMP-1002-code-vault.md) | Numbered mini IDE behavior, architecture, limits, and next workflow |
| [IMP-1003 Projects](implementation-system/implementations/IMP-1003-projects.md) | Numbered editor, table, flowchart, and mindmap rollouts |
| [IMP-1004 Mentor](implementation-system/implementations/IMP-1004-learning-mentor.md) | Numbered Learning and Mentor Agent rollouts |
| [IMP-1005 Career](implementation-system/implementations/IMP-1005-career.md) | Numbered Career Agent rollouts |
| [Feature reviews](feature-review-system/README.md) | Manual feature findings, corrections, status, and verification evidence |
| [SEC-1.0](audit-system/SEC-1.0-security-baseline.md) | Security/privacy DBG records |
| [SYS-1.0](audit-system/SYS-1.0-system-baseline.md) | Architecture/reliability DBG records |

## Ownership rule

- DPL owns complete application states; IMP owns page product outcomes.
- Each page retains its permanent hierarchy: Write `1001.*`, Code Vault `1002.*`, Projects `1003.*`, Learning `1004.*`, Career `1005.*`.
- FTR, SEC, SYS, and DBG contain discovered evidence and corrections only.
- One fact has one owner. Other documents link to it instead of restating it.
