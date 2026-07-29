# FTR-1003 — Write Table Column Menu Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 — Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Affected IMP work | [IMP-1001.1.3](../../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) |
| Surface | Write page table |
| Manual source title | Column Menu: FTR-1003 |
| Source file | `FTR-1003.pdf` |
| Source date | 2026-07-24 |
| Recorded | 2026-07-26 |
| Status | **Verified — 7 of 7 findings completed** |

## Findings

| Finding | Observed gap | Required correction | Status |
|---|---|---|---|
| &emsp;`FTR-1003.1` | Table columns did not provide a complete contextual dropdown menu | Added a `•••` menu to every column header and separated row-specific actions into each row's own contextual menu | ✅ Verified |
| &emsp;&emsp;↳ `FTR-1003.1.1` | The table did not provide a contextual Add subrow action | Added `+ Add subrow` to each row menu while retaining the inline plus as a contextual shortcut | ✅ Verified |
| &emsp;&emsp;↳ `FTR-1003.1.2` | The column menu did not provide a Rename action | Added inline column rename and row-focus rename actions to their corresponding menus | ✅ Verified |
| &emsp;&emsp;↳ `FTR-1003.1.3` | The column menu did not provide a plus control | Added `+ Add column`, which opens the typed-column manager | ✅ Verified |
| &emsp;&emsp;↳ `FTR-1003.1.4` | Rows could not be highlighted from a contextual menu | Added persisted cyan, green, yellow, red, and purple row highlights with a clear option | ✅ Verified |
| &emsp;`FTR-1003.2` | The Add subrow control remained visible outside active interaction | Limited the inline plus to row hover or keyboard focus and kept it visible for touch input | ✅ Verified |
| &emsp;`FTR-1003.3` | Delete was exposed as a standalone button | Moved confirmed column and row deletion into their corresponding contextual menus | ✅ Verified |

## Verification

| Gate | Evidence | Result |
|---|---|---|
| Model and component behavior | 46 repository tests passed, including highlight normalization, contextual actions, rename, subrow creation, confirmed deletion, and menu dismissal | Passed 2026-07-26 |
| Production build | TypeScript and Vite production build completed successfully | Passed 2026-07-26 |
| Signed-in workflow | The Write table exposed column and row menus; the inline subrow control changed from opacity `0` to `1` on focus; row highlight selection operated without console warnings or errors | Passed 2026-07-26 |
| Persistence | The authenticated workspace record retained `highlightColor: green` after server synchronization and browser reload | Passed 2026-07-26 |

## Engineering decision

Column operations remain in column-header menus and row operations remain in row menus. This preserves the requested contextual workflow while making the target of rename, highlight, subrow, and delete actions explicit.
