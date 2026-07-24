---
name: manual-audit
description: Convert a user-performed IO Vault audit from handwriting, screenshots, notes, or conversation into a dated ADT main work code, preserve the user's manual audit code as a separate sub-work code, and number findings beneath the ADT main code, with concise findings, IMP/DBG relationships, and synchronized ledger documentation. Use whenever the user says they performed an audit, provides manual test findings, corrects an audit transcription, or asks to save an audit as coded work.
---

# Manual Audit

Turn user observations into traceable audit records without treating them as verified fixes.

## Workflow

1. Read `docs/work-code-ledger.md` and assign the next unused `ADT-100x` parent code.
2. Preserve the user's manual audit code as the ADT record's sub-work code; do not replace it with an ADT-derived child code.
3. Number every finding beneath the ADT main work code:
   - Parent audit: `ADT-1002`.
   - Manual sub-work: `TEST-IV-1001`.
   - Sequential findings: `ADT-1002.1`, `ADT-1002.2`.
   - A finding explicitly nested beneath another: `ADT-1002.4.1`.
   - Never renumber an assigned child code; append the next available code.
4. Correct transcription only from explicit user clarification. Mark uncertain wording as uncertain instead of guessing.
5. Create `docs/audits/ADT-XXXX-<short-name>.md` with the ADT main code, manual sub-work code, and one compact findings table containing ADT child code, status, problem, recorded date, intended correction, and completion date.
6. Add the parent ADT row to the Audits section of `docs/work-code-ledger.md` and link its related IMP record.
7. Add only supported relationships:
   - `IMP` for the affected product area.
   - Existing `DBG` when the finding matches its authoritative scope.
   - A new `DBG-IMP` only when a correction run is actually planned or started.
8. Mark the parent audit `Complete` when transcription is finished. Keep each correction child `Planned`; add a finish date and `✅ Verified` only after the relevant tests, build, and workflow checks pass.
9. Synchronize `docs/implementation-log.md` and affected IMP planning/status surfaces when the audit changes next work.
10. Run link, Markdown-table, fence, and `git diff --check` validation.

## Writing rules

- Use one short problem and one short intended correction per child row.
- Preserve the distinction between observation, planned correction, and verified result.
- Record both the manual source date and transcription date when they differ.
- Never invent reproduction evidence, severity, dates, fixes, or test results.
- Use the `ticket` skill for the final handoff and commit sentence.
