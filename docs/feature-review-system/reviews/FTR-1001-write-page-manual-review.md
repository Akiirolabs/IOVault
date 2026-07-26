# FTR-1001 — Write Page Manual Feature Review

| Field | Detail |
|---|---|
| Related work | [IMP-1001 Notes / Write](../../implementation-system/areas/IMP-1001-notes-write.md) |
| Former code | `ADT-1002` |
| Manual sub-work code | `TEST-IV-1001` |
| Source title | Testing Table and Notes |
| Manual source date | 2026-07-24 |
| Transcribed | 2026-07-24 |
| Correction runs | `FTR-IMP-1001`, `FTR-IMP-1002`, `FTR-IMP-1004` |
| Status | Complete review; 8 of 8 corrections verified |

## Findings

| Sub-work code | Status | Problem · observed | Intended correction | Finished |
|---|---|---|---|---|
| FTR-1001.1 | ✅ Verified | Subrows are missing · 2026-07-24 | Added nested rows, persisted collapse state, hierarchy-safe reload normalization, and sibling sorting | 2026-07-24 |
| FTR-1001.2 | ✅ Verified | Tables and notes cannot be deleted · 2026-07-24 | Added recoverable Delete to each page's `•••` menu with confirmation, subtree archiving, selection, and restoration | 2026-07-24 |
| FTR-1001.3 | ✅ Verified | Parent lists cannot be collapsed · 2026-07-24 | Added persisted expand/collapse controls to page sections | 2026-07-25 |
| FTR-1001.4 | ✅ Verified | Notes need a fuller toolbar · 2026-07-24 | Added headings, emphasis, lists, quote, code, history, and clear formatting | 2026-07-25 |
| FTR-1001.4.1 | ✅ Verified | A table column cannot turn each cell into a full page · 2026-07-24 | Added Page columns whose cells create and reopen linked pages | 2026-07-25 |
| FTR-1001.5 | ✅ Verified | Notes and tables cannot be dragged between sections · 2026-07-24 | Added hierarchy-safe drag/drop plus keyboard move actions | 2026-07-25 |
| FTR-1001.6 | ✅ Verified | Sections cannot be renamed · 2026-07-24 | Verified persistent inline section renaming | 2026-07-25 |
| FTR-1001.7 | ✅ Verified | Archived content cannot be reliably recovered · 2026-07-24 | Added ancestor/subtree recovery and Restore all | 2026-07-25 |

`TEST-IV-1001` remains the manual source code. Findings belong to `FTR-1001` as numbered children; their corrections use separate correlated `FTR-IMP` codes.
