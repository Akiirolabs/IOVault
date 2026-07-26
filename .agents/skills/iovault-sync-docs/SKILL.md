---
name: iovault-sync-docs
description: Keep IO Vault repository documentation synchronized with verified implementation work. Use after any code, bug-fix, API, data-model, architecture, UI-flow, Code Vault, security, audit, feature-review, deployment, test, or roadmap run that changes behavior, status, limitations, or evidence.
---

# IO Vault Documentation Sync

Update documentation from the final diff and actual verification output; never infer completion.

## Workflow

1. Read `docs/work-system/README.md` and route the run to its authoritative system.
2. Update that detailed record plus `docs/work-system/ledger.md`.
3. Update current behavior, status, evidence, limitations, and next action consistently.
4. Search all docs for the work code, former code, old status, and superseded terminology.
5. Keep `docs/implementation-log.md` chronological; append only when delivery history changed.
6. Validate links, tables, headings, Mermaid fences, and `git diff --check`.

## Routing matrix

| Work | Authority |
|---|---|
| `IMP` | `docs/implementation-system/` area, register, and verification panel |
| `DBG`, `DBG-IMP` | `docs/debug-system/` issue, register, attempts, and verification evidence |
| `ADT` | `docs/audit-system/` record |
| `FTR`, `FTR-IMP` | `docs/feature-review-system/` review and correction links |
| `DOC` | Affected documentation plus ledger |
| `DPL` | `docs/deployment-system/` release record |
| Priority change | `docs/roadmap.md` |
| Runtime boundary or data flow | `docs/architecture.md` |
| Documentation navigation | `docs/README.md` |

Only IMP owns speculative roadmap work. Link across systems rather than duplicating scope or evidence. Preserve former identifiers only in migration aliases or explicit `Former code` metadata.

## Writing standard

- Lead with current behavior and status; use concise tables for structured facts.
- Use editable Mermaid only when relationships need a diagram.
- Preserve exact paths, limits, endpoints, and verified test counts.
- Never record secrets, private content, invented evidence, or unrun results.
