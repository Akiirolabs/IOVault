---
name: work-review
description: Route IO Vault manual feature reviews, code/security/compliance audits, discovered problems, corrections, documentation runs, and deployments into the correct work-system code and synchronized records. Use when the user reports review or audit findings, corrects a transcription, asks to code reviewed work, or starts a finding-driven correction.
---

# Work Review Router

Classify evidence before assigning a code. Never turn observations into verified fixes.

## Workflow

1. Read `docs/work-system/README.md`, `ledger.md`, and `migration-map.md`.
2. Route the run:
   - proactive main-page product work → `IMP`;
   - discovered technical, system, security, privacy, performance, cost, or maintenance issue → `DBG`;
   - correction from DBG or code-level ADT → `DBG-IMP`;
   - full code, architecture, health, compliance, or security audit → `ADT`;
   - manual page-feature review or micro-finding → `FTR`;
   - correction from FTR → `FTR-IMP`;
   - documentation-only work → `DOC`;
   - complete production release → `DPL`.
3. Preserve any user-provided manual code as source metadata. Number findings beneath the assigned ADT or FTR parent; never make findings children of the manual source code.
4. Correct transcriptions only from explicit evidence. Mark uncertain wording instead of guessing.
5. Update the authoritative specialized record and `docs/work-system/ledger.md`. Link affected IMP pages without duplicating ownership.
6. Never reuse retired codes or renumber started/completed work. Only future unstarted IMP children may be reprioritized.
7. Mark a review/audit complete when its evidence capture is complete. Mark corrections verified only after their own acceptance evidence passes.
8. Use `iovault-sync-docs`, validate documentation, then use `ticket` for the handoff.

## Writing rules

- Keep problem, evidence, intended correction, status, and dates distinct.
- Only IMP may contain speculative future product work.
- Use compact tables and one authoritative detail location.
- Never invent severity, dates, reproduction evidence, fixes, or test results.
