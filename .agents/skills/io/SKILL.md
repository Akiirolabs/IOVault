---
name: io
description: Classify, route, and trace IO Vault work through its deployment lifecycle. Use when deciding whether proposed or completed work belongs to DPL, IMP, FTR, SEC, SYS, or a DBG; assigning or reviewing work codes; determining where corrections and verification belong; or preventing duplicate and unnecessary records.
---

# IO Work System

Route work through:

`active DPL → IMP outcomes → FTR/SEC/SYS findings and corrections → verification → active DPL update → next DPL`

## Establish context

1. Read `docs/deployment-ledger/README.md` and the relevant owning record before assigning a code.
2. Determine whether the input is a future product outcome, manual finding, discovered technical problem, correction, or complete tested state.
3. Reuse an existing owner when the underlying problem is already recorded. Create a new record only for a distinct responsibility.

## Route work

| Work | Owner |
|---|---|
| Complete application architecture state released for testing | `DPL` |
| Planned consumer-facing page capability or rollout | Permanent page `IMP` |
| Manual page-level feature review and its corrections | `FTR` |
| Security, privacy, credentials, abuse, validation, or dependency-integrity evidence | `SEC` baseline with one owning `DBG` |
| Reliability, persistence, performance, architecture, maintainability, testing infrastructure, UI systems, or operations evidence | `SYS` baseline with one owning `DBG` |
| Documentation-only maintenance | No work code |

Permanent implementations are Write `IMP-1001`, Code Vault `IMP-1002`, Projects `IMP-1003`, Learning/Mentor `IMP-1004`, and Career `IMP-1005`. Number their rollouts and changes beneath the matching parent.

Link every FTR to the exact IMP child or sub-code whose behavior it reviews, not only to the page parent. Add the FTR as linked review evidence in that IMP rollout table. Reuse an existing sub-code when it already owns the behavior; create a deeper code such as `IMP-1002.1.1.1` only when the work is a distinct nested implementation outcome with its own scope and acceptance criteria. Code Vault may need this depth for repository, editor, assistant, patch-review, or publishing capabilities, but depth follows ownership rather than page preference.

Render each IMP hierarchy in one numbered table. Keep rollout rows such as `.1` and `.2` unindented and arrow-free. Render `.1.1` with one indentation level and a `↳` marker, then add one more indentation level for each deeper segment such as `.1.1.1`. Preserve the complete code text so indentation never replaces traceability.

When a comma- or semicolon-separated parent outcome is decomposed into deeper work codes, mark each decomposed parent phrase with bold numbered markers such as **①**, **②**, and **③**. Repeat the matching marker at the start of each child outcome. Prefer these accessible, theme-independent markers over colored text or highlighting.

## Preserve ownership

- Keep corrections and verification inside the FTR or DBG that identified the problem. Do not create correction-only series.
- Keep every DBG in exactly one SEC or SYS lane.
- Link technical corrections to an IMP only when they enable or constrain that page outcome; do not reclassify them as product implementations.
- Allow future-state language only in DPL and IMP records. SEC, SYS, DBG, and FTR require observed evidence.
- Treat DPL as the single chronological deployment ledger. Keep the active DPL as a living testing-state manifest until the next DPL replaces it.
- Add every newly verified result to the active DPL and update its included scope, date, test/build evidence, limitations, and other affected readiness fields. Update its commit SHA after the completed state is committed; never claim an uncommitted SHA.
- Keep earlier, superseded DPL records immutable except when correcting inaccurate historical information.
- Preserve retired identifiers only as migration aliases. Never reuse or silently renumber completed work.
- Keep one detailed owner and concise linked summaries. Never duplicate the same evidence across records.

## Classify implementation work

Technical changes such as CI, conflict-safe synchronization, module extraction, server modularization, linting, browser E2E, CSS ownership, monitoring, backups, and production operations are SYS or SEC corrections. They are not IMP work unless the change itself defines new consumer-facing behavior.

When several tasks address one root problem, record them as correction steps under one DBG. Split them only when they have different owners, risks, acceptance criteria, or independent release decisions.

## Complete a run

1. Update the detailed owning record.
2. Update every correlating summary required by the work type:

| Verified work | Required correlated records |
|---|---|
| FTR correction | FTR file with exact affected IMP codes, FTR register, linked evidence in each affected IMP row, ledger chronology, active DPL |
| SEC/SYS correction | Owning DBG, audit register, related IMP when applicable, ledger chronology, active DPL |
| IMP outcome | IMP file, implementation register, ledger chronology, active DPL |
| Complete replacement testing state | New DPL, ledger chronology, and Version register when applicable |

3. Update the active DPL's verification totals and dates whenever the final verified run changes them; do not leave earlier test evidence presented as current.
4. Keep the planned next DPL focused on future outcomes. When it becomes the deployed testing state, make it active and stop adding new work to the prior DPL.
5. Record actual verification without upgrading partial or untested work to Verified or Deployed.
6. Use `iovault-sync-docs` for documentation synchronization and `ticket` for the final evidence-based handoff.

Never invent evidence, create speculative DBG/FTR records, use README files as detailed owners, or assign a new code merely because a file changed.
