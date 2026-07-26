# Feature Review System

FTR records manual page-level findings and keeps each correction and verification with the finding that produced it. These are reviews of [IMP-1001 Write](../implementation-system/implementations/IMP-1001-write.md), not future implementation plans.

## FTR-1001 — Write manual review

**Manual source:** `TEST-IV-1001`, “Testing Table and Notes” · **Source/transcribed:** 2026-07-24 · **Status:** 8/8 verified

| Finding | Problem | Verified correction | Finished |
|---|---|---|---|
| `FTR-1001.1` | Subrows missing | Nested rows, persisted collapse, reload normalization, sibling sorting | 2026-07-24 |
| `FTR-1001.2` | Tables/notes could not be deleted | Confirmed recoverable subtree Delete in the parent `•••` menu | 2026-07-24 |
| `FTR-1001.3` | Parent lists could not collapse | Persisted page-section expand/collapse | 2026-07-25 |
| `FTR-1001.4` | Notes needed a fuller toolbar | Headings, emphasis, lists, quote, code, history, clear formatting | 2026-07-25 |
| `FTR-1001.4.1` | Table cells could not become full pages | Page columns create and reopen linked pages | 2026-07-25 |
| `FTR-1001.5` | Notes/tables could not move between sections | Hierarchy-safe drag/drop and keyboard moves | 2026-07-25 |
| `FTR-1001.6` | Sections could not be renamed | Persistent inline section rename verified | 2026-07-25 |
| `FTR-1001.7` | Archived content could not be reliably recovered | Ancestor/subtree recovery and Restore all | 2026-07-25 |

## FTR-1002 — Write actions review

**Manual source date:** not supplied · **Transcribed:** 2026-07-24 · **Status:** 6/6 verified

| Finding | Problem | Verified correction | Finished |
|---|---|---|---|
| `FTR-1002.1` | Dropdown behind page content | Document-layer menu at z-index 1001 | 2026-07-24 |
| `FTR-1002.2` | Page icon could not change | Persisted per-page icon choices | 2026-07-24 |
| `FTR-1002.3` | Import appeared TXT-only | TXT, Markdown, CSV, and JSON import | 2026-07-24 |
| `FTR-1002.4` | Menu too far from dots | Anchored six pixels beside trigger | 2026-07-24 |
| `FTR-1002.5` | Another page’s menu selected that page | Decoupled menu opening from page selection | 2026-07-24 |
| `FTR-1002.6` | Template choice could not add or replace | Add new page, Replace current page, and Cancel | 2026-07-24 |

The repeated trailing `FTR-1002.6` in the transcription contained no additional finding and remains a transcription duplicate, not a seventh issue. Former FTR-IMP identifiers remain searchable only in the Deployment Ledger migration history.
