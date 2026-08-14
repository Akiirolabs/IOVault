# FTR-1013 — Projects Editing and Table Review

**Status:** Verified · **Date:** 2026-08-13 · **Implementations:** [IMP-1003](../../implementation-system/implementations/IMP-1003-projects.md), [IMP-1006](../../implementation-system/implementations/IMP-1006-settings.md)

## Findings

| Finding | Problem | Correction | Status |
|---|---|---|---|
| &emsp;`FTR-1013.1` | The project-card document window displayed content but did not support direct editing. | The fixed-height card window now edits the same Rich Text or Markdown field as the full-page editor, presents one mode at a time, and isolates card movement to a dedicated drag handle. | Verified |
| &emsp;&emsp;↳ `FTR-1013.1.1` | The mini-window scrollbar exposed that native scrollbars did not consistently follow Theme Mode across IO Vault. | Shared scrollbar variables now theme every native scrollable surface across all pages, with active-hue Default/Tinted styling and dedicated Light and Night contrast. | Verified |
| &emsp;`FTR-1013.2` | Typed-table controls competed visually and Select properties could not be maintained safely after creation. | The table now uses focused property and row menus, safe confirmed type conversion, editable Select options, atomic cleanup, and unclipped foreground popovers. | Verified |
| &emsp;`FTR-1013.3` | Flowchart and Mindmap three-dot menus could render behind descriptions or be clipped by the canvas. | Shared portal menus now anchor to the selected trigger, remain viewport-aware, close competing surfaces, and support outside, Escape, and keyboard navigation. | Verified |
| &emsp;`FTR-1013.4` | Project-card drag and three-dot controls displayed permanent boxes that competed with the card content. | Both controls are borderless at rest; theme-matched surfaces appear on hover, focus, menu-open, and drag states, while the drag dots glow throughout the gesture. | Verified |

## Verification

- `npx vitest run src/projects/ProjectModes.test.tsx src/App.auth-persistence.test.tsx` — 19/19 passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- DevMind approved the final diff after the initial review blockers were corrected.
- The global themed-scrollbar correction passed the production build and diff check on 2026-08-13.
- The refined project-card controls passed the production build and diff check on 2026-08-13.

Live appearance, pointer feel, and stacking across every theme remain pending browser acceptance; repository behavior and component interactions are verified.
