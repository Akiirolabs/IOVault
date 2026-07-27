# FTR-1001 — Write Manual Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 — Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Manual source | `TEST-IV-1001` — Testing Table and Notes |
| Source date | 2026-07-24 |
| Transcribed | 2026-07-24 |
| Status | **Complete — 8 of 8 findings verified** |

## Findings and corrections

| Finding | Problem | Verified correction | Finished |
|---|---|---|---|
| `FTR-1001.1` | Subrows were unavailable | Added nested rows, persisted collapse state, reload normalization, and sibling sorting | 2026-07-24 |
| `FTR-1001.2` | Tables and notes could not be deleted | Added confirmed, recoverable subtree deletion through the parent `•••` menu | 2026-07-24 |
| `FTR-1001.3` | Parent lists could not collapse | Added persisted page-section expand and collapse controls | 2026-07-25 |
| `FTR-1001.4` | Notes required a complete formatting toolbar | Added headings, emphasis, lists, quotes, code, history, and clear formatting | 2026-07-25 |
| `FTR-1001.4.1` | Table cells could not open as full pages | Added Page columns that create and reopen linked pages | 2026-07-25 |
| `FTR-1001.5` | Notes and tables could not move between sections | Added hierarchy-safe drag-and-drop and keyboard movement | 2026-07-25 |
| `FTR-1001.6` | Sections could not be renamed | Verified persistent inline section renaming | 2026-07-25 |
| `FTR-1001.7` | Archived content could not be reliably recovered | Added ancestor and subtree recovery with Restore all | 2026-07-25 |

## Verification

The completed review is covered by 44 passing tests, a successful production build, and signed-in browser acceptance of formatting, hierarchy, linked pages, keyboard movement, rename persistence, and archive recovery on 2026-07-25.
