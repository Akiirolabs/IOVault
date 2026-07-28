# FTR-1005 — Write Plus Menu Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1001 — Write](../../implementation-system/implementations/IMP-1001-write.md) |
| Affected IMP work | [IMP-1001.1.2.1](../../implementation-system/implementations/IMP-1001-write.md#numbered-implementation) |
| Manual source title | Plus Button: FTR-1005 |
| Source file | `FTR-1004_FTR-1005.pdf` |
| Interface references | `Screenshot 2026-07-27 at 2.40.12 AM.png`; `Screenshot 2026-07-27 at 2.40.32 AM.png` |
| Source date | 2026-07-26 |
| Recorded | 2026-07-27 |
| Status | **Partial — 3 of 4 findings verified** |

## Findings and corrections

| Finding | Observed requirement | Correction | Status |
|---|---|---|---|
| `FTR-1005.1` | The note page needs a `+` menu covering Basic, Layout, Media, and Math/Code insertion categories | Added a functional first release containing text styles, formatting, lists, quote, code, clear formatting, and history; additional block types remain open | Partial |
| `FTR-1005.1.1` | Formatting controls should live in the `+` menu and also appear at the top only while the editor is hovered or keyboard-focused | Added a shared command model, hover/focus top toolbar, and `+` formatting menu without exposing unsupported actions | ✅ Verified |
| `FTR-1005.2` | The same `+` control should remain available when a note is opened from a table Page column | Kept the control inside the shared note editor used by linked Page cells | ✅ Verified |
| `FTR-1005.3` | The dropdown should remain beside the `+` trigger and above surrounding content | Anchored the menu to the trigger inside a sticky foreground control layer with bounded scrolling | ✅ Verified |

## Verification

| Gate | Evidence | Result |
|---|---|---|
| Component behavior | The toolbar is absent initially, the `+` menu exposes all supported commands, formatting executes, hover and focus reveal the top toolbar, Escape dismisses the menu, and linked Page notes retain the control | Passed 2026-07-27 |
| Repository suite | `npm test` completed with 10 files and 46 tests passing | Passed 2026-07-27 |
| Production build | TypeScript and Vite production build completed successfully | Passed 2026-07-27 |
| Signed-in workflow | The menu replaced the top toolbar while open, remained left-aligned 13 pixels below the trigger at z-index 70, closed after formatting, and produced no console warnings or errors | Passed 2026-07-27 |

## Remaining scope

Layout, media, advanced math/code, data-view, and chart blocks remain open under `FTR-1005.1`. They will be added only with functional data contracts, persistence, and interaction coverage.
