# ADT-1002 — Write Page Manual Audit

| Field | Detail |
|---|---|
| Related work | [IMP-1003 Notes / Write](../implementation-system/areas/IMP-1003-notes-write.md) |
| Manual sub-work code | `TEST-IV-1001` |
| Source title | Testing Table and Notes |
| Manual source date | 2024-10-24 |
| Transcribed | 2026-07-24 |
| Status | Complete audit; 1 of 8 corrections verified |

## Findings

| Sub-work code | Status | Problem · observed | Intended correction | Finished |
|---|---|---|---|---|
| ADT-1002.1 | ✅ Verified | Subrows are missing · 2024-10-24 | Added nested rows, persisted collapse state, hierarchy-safe reload normalization, and sibling sorting | 2026-07-24 |
| ADT-1002.2 | Planned | Tables and notes cannot be deleted · 2024-10-24 | Add recoverable deletion for both content types | — |
| ADT-1002.3 | Planned | Parent lists cannot be collapsed · 2024-10-24 | Add persistent hierarchy collapse controls | — |
| ADT-1002.4 | Planned | Notes need a fuller toolbar · 2024-10-24 | Add the approved note-formatting controls | — |
| ADT-1002.4.1 | Planned | A table column cannot turn each cell into a full page · 2024-10-24 | Add a Page column type whose cells create or open full pages | — |
| ADT-1002.5 | Planned | Notes and tables cannot be dragged between sections · 2024-10-24 | Add accessible drag-and-drop organization with a keyboard alternative | — |
| ADT-1002.6 | Planned | Sections cannot be renamed · 2024-10-24 | Add inline section renaming with persistence | — |
| ADT-1002.7 | Planned | Archived content cannot be reliably recovered · 2024-10-24 | Add visible archive recovery for notes, tables, and descendants | — |

`TEST-IV-1001` is the manual sub-work code of `ADT-1002`. The findings belong to the ADT main code as `ADT-1002.x`; correction runs receive separate correlated `DBG-IMP` codes when scheduled.
