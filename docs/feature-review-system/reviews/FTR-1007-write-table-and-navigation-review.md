# FTR-1007 - Write Table and Navigation Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 - Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Affected IMP work | [IMP-1001.1.3.1.1, 1001.1.3.1.2, 1001.1.3.2, 1001.2.1, and 1001.2.5](../../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) |
| Manual source title | Write Page: FTR-1007 |
| Source file | `FTR-1007_Notes.pdf` |
| Source date | 2026-07-30 |
| Recorded | 2026-07-30 |
| Status | **Verified - 7 of 7 findings completed** |

## Findings

| Finding | Observed requirement | Status |
|---|---|---|
| &emsp;`FTR-1007.1` | Give wide tables a clearly visible horizontal drag bar styled with the active IO Vault theme | Verified |
| &emsp;`FTR-1007.2` | Relation properties should select a value from a user-selected table and store that related record in the cell | Verified |
| &emsp;&emsp;↳ `FTR-1007.2.1` | Show available related records in a selectable popup | Verified |
| &emsp;&emsp;↳ `FTR-1007.2.2` | Keep the relation popup in the foreground and conveniently anchored to its triggering cell | Verified |
| &emsp;`FTR-1007.3` | Make Formula configuration more capable and easier to apply | Verified |
| &emsp;`FTR-1007.4` | Allow pages and sections in the left explorer to be reordered directly by dragging | Verified |
| &emsp;`FTR-1007.5` | Make the Note, Table, and Testing Panel creation buttons slimmer, thinner, modern, and glass-like | Verified |

## Source normalization

The handwritten source labels both relation child findings as `FTR-1007.2.1`. The second child is recorded as `FTR-1007.2.2` to preserve a unique hierarchy without changing its meaning.

## Implemented correction

| Surface | Completed result |
|---|---|
| Wide tables | Styled the table’s native horizontal scrollbar with a darker active-theme thumb without adding a second navigation control. |
| Relations | Added persisted source-table metadata, stable row identifiers, a selectable record popup, clear-state support, and self-relation support. |
| Popup placement | Anchored the fixed popup 6 px below its triggering cell at foreground layer `10020`. |
| Formulas | Added guided column/operator/function controls and bounded `SUM`, `AVERAGE`, `MIN`, `MAX`, `ROUND`, and `ABS` evaluation without dynamic code execution. |
| Explorer | Changed direct drag-and-drop from implicit nesting to visible sibling reordering while retaining explicit parent controls. |
| Creation controls | Refined Note, Table, and Testing Panel actions into compact glass controls that inherit the active visual system. |

## Verification

- Focused Write suite: 20/20 tests passed.
- Full suite: 10 files and 50/50 tests passed.
- Production build: TypeScript and Vite build passed.
- Signed-in browser: source table selection, record popup, persisted record label, native themed table scrolling, compact glass controls, and direct foreground placement passed with zero console errors on 2026-07-30.
