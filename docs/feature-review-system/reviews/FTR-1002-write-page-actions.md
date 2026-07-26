# FTR-1002 — Write Page Actions Feature Review

| Field | Detail |
|---|---|
| Related work | [IMP-1001 Notes / Write](../../implementation-system/areas/IMP-1001-notes-write.md) |
| Former code | `ADT-1003`; existing manual identifier `FTR-1002` retained |
| Manual source date | Not supplied |
| Transcribed | 2026-07-24 |
| Correction run | `FTR-IMP-1003` |
| Status | Complete review; 6 of 6 corrections verified |

## Findings

| Sub-work code | Status | Problem · recorded | Correction | Finished |
|---|---|---|---|---|
| FTR-1002.1 | ✅ Verified | Dropdown was behind page content · 2026-07-24 | Rendered it in the document layer at z-index 1001 | 2026-07-24 |
| FTR-1002.2 | ✅ Verified | Page icons could not be changed · 2026-07-24 | Added persisted per-page icon choices | 2026-07-24 |
| FTR-1002.3 | ✅ Verified | Import appeared limited to `.txt` · 2026-07-24 | Exposed TXT, Markdown, CSV, and JSON import | 2026-07-24 |
| FTR-1002.4 | ✅ Verified | Dropdown appeared too far from its dots · 2026-07-24 | Anchored it six pixels beside the trigger | 2026-07-24 |
| FTR-1002.5 | ✅ Verified | Opening another page's menu changed the active page · 2026-07-24 | Decoupled menu opening from page selection | 2026-07-24 |
| FTR-1002.6 | ✅ Verified | Template selection had no add-or-replace choice · 2026-07-24 | Added Add new page, Replace current page, and Cancel | 2026-07-24 |

The repeated trailing `FTR-1002.6` in the transcription contained no additional finding and is retained as a transcription duplicate, not a seventh issue.
