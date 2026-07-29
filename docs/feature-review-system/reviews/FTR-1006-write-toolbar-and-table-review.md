# FTR-1006 — Write Toolbar and Table Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 — Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Affected IMP work | [IMP-1001.1.2.1, 1001.1.3, and 1001.1.3.1](../../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) |
| Manual source title | Toolbar Notes: FTR-1006 |
| Source file | `FTR-1006.pdf` |
| Source date | 2026-07-27 |
| Recorded | 2026-07-29 |
| Status | **Verified — 12 of 12 findings completed** |

## Findings

| Finding | Observed requirement | Status |
|---|---|---|
| &emsp;`FTR-1006.1` | The formatting toolbar should remain hidden until the pointer enters its dedicated toolbar area; editor hover or focus alone must not reveal it | Verified |
| &emsp;`FTR-1006.2` | Remove the empty, unusable trailing table column | Verified |
| &emsp;`FTR-1006.3` | Enter should move editing to the same column in the next row | Verified |
| &emsp;`FTR-1006.4` | Copy and paste should preserve large text selections and their formatting without truncation or corruption | Verified |
| &emsp;`FTR-1006.5` | The linked-page minimize control should remain visible while the page scrolls, and clicking outside the overlay should minimize it | Verified |
| &emsp;`FTR-1006.6` | The column menu should provide an Edit column action | Verified |
| &emsp;&emsp;↳ `FTR-1006.6.1` | The column menu should provide ascending and descending sort actions | Verified |
| &emsp;&emsp;↳ `FTR-1006.6.2` | Edit column should provide a property-type selector | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1006.6.2.1` | Add a Currency property type | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1006.6.2.2` | Add a Single select property type | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1006.6.2.3` | Add Percent, Email, Formula, and Relation property types | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1006.6.2.4` | Page-property content should persist inside its collection cell without creating a separate sidebar note | Verified |

## Implemented correction

The Write editor now reveals its unified formatting group only over the dedicated control area, persists native formatted paste results, keeps linked-page controls sticky, minimizes overlays on outside-click, removes the unused action column, and moves Enter to the same property in the next visible row. Column menus expose editing and explicit sort direction. Collections support Currency, Percent, Email, Single select, Formula, Relation, and embedded Page properties; formulas evaluate bounded arithmetic with named-column references, relations link existing Write pages, and Page content remains owned by its collection cell.

**Acceptance correction:** The initial 2026-07-29 verification interpreted editor-wide hover/focus as valid toolbar behavior, checked the sticky header without exercising scroll, and retained Page cells as sidebar-backed notes. Those interpretations were rejected during manual acceptance and replaced by the verified behaviors above.

## Verification

| Gate | Result |
|---|---|
| Focused model and component coverage | Passed — 29 tests |
| Complete repository suite | Passed — 49 tests |
| Production build | Passed |
| Signed-in browser acceptance | Passed — toolbar boundary, embedded Page ownership, outside-click minimize, sticky control position after scroll, state restoration, and zero console errors |
| Completed | 2026-07-29 |
