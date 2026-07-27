# FTR-1002 — Write Actions Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 — Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Manual source date | Not supplied |
| Transcribed | 2026-07-24 |
| Status | **Complete — 6 of 6 findings verified** |

## Findings and corrections

| Finding | Problem | Verified correction | Finished |
|---|---|---|---|
| `FTR-1002.1` | The action menu appeared behind page content | Rendered the menu in the document layer at z-index 1001 | 2026-07-24 |
| `FTR-1002.2` | Page icons could not be changed | Added persisted per-page icon choices | 2026-07-24 |
| `FTR-1002.3` | Import appeared limited to TXT files | Added TXT, Markdown, CSV, and JSON import options | 2026-07-24 |
| `FTR-1002.4` | The menu appeared too far from its trigger | Anchored the menu six pixels beside the trigger | 2026-07-24 |
| `FTR-1002.5` | Opening another page’s menu changed the active page | Decoupled menu opening from page selection | 2026-07-24 |
| `FTR-1002.6` | Template selection could not add a page or replace the current page | Added Add new page, Replace current page, and Cancel choices | 2026-07-24 |

The repeated trailing `FTR-1002.6` in the source transcription contained no additional finding and is retained as a transcription duplicate rather than a seventh issue.

## Verification

The completed review is covered by 38 passing tests, a successful production build, and signed-in browser acceptance of menu layering, icon persistence, multi-format imports, trigger positioning, stable page selection, and template choices on 2026-07-24.
