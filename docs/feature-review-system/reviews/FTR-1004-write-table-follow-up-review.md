# FTR-1004 — Write Table Follow-up Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 — Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Affected IMP work | [IMP-1001.1.3, 1001.2.2, and 1001.2.4](../../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) |
| Manual source title | Table: FTR-1004 |
| Source file | `FTR-1004_FTR-1005.pdf` |
| Source date | 2026-07-26 |
| Recorded | 2026-07-27 |
| Completed | 2026-07-28 |
| Status | **Verified — 11 of 11 findings** |

## Findings

| Finding | Observed requirement | Status |
|---|---|---|
| `FTR-1004.1` | A linked Page column should open over the table and minimize back into its originating cell | Verified |
| `FTR-1004.2` | Row menus should remain in the foreground without being clipped or hidden | Verified |
| `FTR-1004.2.1` | Row creation should use a left-side `+` with an adjacent hover-revealed `•••` menu | Verified |
| `FTR-1004.2.2` | Row color selection should remain inside the `•••` actions menu without a duplicate control | Verified |
| `FTR-1004.2.3` | Row controls must not obstruct the open row menu | Verified |
| `FTR-1004.3` | Table-column widths should be adjustable | Verified |
| `FTR-1004.4` | Page icon selection should provide additional choices | Verified |
| `FTR-1004.5` | Import should accept CSV and supported document files | Verified |
| `FTR-1004.6` | Status options should be entered individually and committed with Enter instead of comma-separated input | Verified |
| `FTR-1004.6.1` | Configured status options should remain selectable through a dropdown | Verified |
| `FTR-1004.7` | All, Open, and Done controls should be smaller, borderless, and visually secondary | Verified |

## Correction

Linked Page cells now open in a focused overlay while preserving the collection beneath them and minimize directly back to the source table. Row creation and the `•••` action control are grouped beside the first cell; color choices remain inside that foreground menu without a redundant trigger. Column widths persist with the collection, icon selection provides sixteen choices, imports accept CSV and supported text/HTML documents, status choices are managed as individual Enter-confirmed options, and collection filters use a compact secondary presentation.

## Verification

| Check | Result |
|---|---|
| Write and model tests | 28 passed, including linked-page overlays, persisted resizing, foreground color menus, and individual status options |
| Full suite | 10 files and 48 tests passed |
| Production build | TypeScript and Vite build passed |
| Signed-in browser | Updated controls and resize handles rendered in the active Write collection; no console errors or warnings |
| Repository check | `git diff --check` passed |
