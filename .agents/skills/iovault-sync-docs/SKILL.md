---
name: iovault-sync-docs
description: Synchronize IO Vault's consolidated Deployment Ledger, page implementations, feature reviews, SEC/SYS audit lanes, architecture, and verification after repository work changes behavior, outcomes, findings, corrections, or complete testing states.
---

# IO Vault Documentation Sync

Use the final diff and actual verification output; never infer completion.

## Authoritative files

- chronology, Versions, aliases, or complete-state routing → `docs/deployment-ledger/README.md`;
- historical/current/planned complete state → matching `docs/deployment-ledger/DPL-*.md`;
- page outcome → matching `docs/implementation-system/implementations/IMP-*.md`;
- implementation register/dependencies/gates → `docs/implementation-system/README.md`;
- manual findings/corrections → `docs/feature-review-system/README.md`;
- security/privacy DBG → `docs/audit-system/SEC-1.0-security-baseline.md`;
- system/architecture DBG → `docs/audit-system/SYS-1.0-system-baseline.md`;
- audit index/evidence summary → `docs/audit-system/README.md`.

## Required checks

1. Use `project-owner-voice` for every human-facing description or narrative change.
2. Keep one detailed owner, but require concise linked summaries in DPL, README, register, and other aggregate records.
3. A DPL release manifest links every included IMP, FTR, SEC, and SYS record and states its included scope and exact status.
4. Never replace traceability with a generic lane label or an unlinked list.
5. Update DPL-1002 architecture only when runtime boundaries change; never alter protected Mermaid blocks.
6. Search for superseded paths, retired terminology, prompt/process language, screenshot framing, assistant voice, and unlinked aggregated work.
7. Validate links, headings, tables, Mermaid fences, skill metadata, and `git diff --check`.

Only DPL and IMP contain future outcomes. Every DBG belongs to one lane. Documentation-only maintenance receives no work code. Never record secrets, private content, invented evidence, or unrun results.
