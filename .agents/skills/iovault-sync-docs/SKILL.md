---
name: iovault-sync-docs
description: Keep IO Vault repository documentation synchronized with verified implementation work. Use after any code, bug-fix, API, data-model, architecture, UI-flow, Code Vault, security, test, or roadmap run that changes current behavior, completion status, limitations, or verification evidence.
---

# IO Vault Documentation Sync

Update documentation as part of the implementation run, not as a later cleanup task.

## Workflow

1. Inspect the final diff and actual verification output. Never infer completion from edited code.
2. Identify every affected documentation surface using the matrix below.
3. Update current-state statements, status, evidence, limitations, and next action consistently.
4. Search all `docs/` files for the feature/debug code and remove stale contradictions.
5. Run `git diff --check`; verify Markdown tables and Mermaid fences are structurally complete.

## Update matrix

| Change | Required documents |
|---|---|
| Any meaningful implementation | `docs/implementation-log.md` and relevant feature document |
| Priority or completion changed | `docs/roadmap.md` |
| Route, storage, ownership, or data flow changed | `docs/architecture.md` and `docs/diagrams.md` |
| Code Vault behavior changed | `docs/code-vault-mini-ide.md` and `docs/code-vault-architecture.md` |
| DBG issue worked | Individual issue, `issue-register.md`, `issue-register.csv`, `implementation-status.md`, `fix-attempts.md`, and `verification-matrix.md` |
| Issue/service dependencies changed | Relevant `debug-system/graphs/` Mermaid file and service-impact chart |
| Documentation navigation changed | `docs/README.md` |

For a completed DBG issue, every status surface must say `Verified` only after its required tests and production build pass. Keep fix attempts append-only; historical limitations may remain in their dated row.

## Writing standard

- Lead with current behavior and status.
- Use compact tables for status, ownership, limits, verification, and comparisons.
- Use Mermaid only for flows, dependencies, sequences, or architecture boundaries.
- Keep prose for intent, rationale, constraints, tradeoffs, and migration guidance.
- Prefer one authoritative detail location and link to it instead of duplicating long explanations.
- Preserve exact paths, limits, endpoint names, and verified test counts.
- Never record secrets, tokens, prompts, private vault content, invented evidence, or unrun results.

## Final audit

Search for the changed feature name, endpoint, debug code, previous status, old limits, and superseded terminology across `docs/`. Report which documents changed, verification evidence, and any deliberately retained historical statement.
