# FTR-1012 - Projects Content and Layout Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1003 - Projects](../../implementation-system/implementations/IMP-1003-projects.md) |
| Affected IMP work | `IMP-1003.1.1`, `IMP-1003.1.4`, `IMP-1003.2.2`, `IMP-1003.3.4`, and `IMP-1003.4.5` |
| Manual source title | Product Page: FTR-1012 |
| Source file | `FTR-1012_projects.pdf` |
| Source date | 2026-08-01 |
| Recorded | 2026-08-01 |
| Status | **Verified - 5 of 5 findings verified** |

## Findings

| Finding | Observed requirement | Affected IMP work | Status |
|---|---|---|---|
| &emsp;`FTR-1012.1` | Keep scrolling inside the open full-page project workspace instead of scrolling the background page | `IMP-1003.1.1` | Verified |
| &emsp;`FTR-1012.2` | Reflect the full-page project content automatically in the project card’s mini view without copy and paste | `IMP-1003.1.4.1` | Verified |
| &emsp;`FTR-1012.3` | Render Markdown naturally in the project-card mini view, matching the full-page preview | `IMP-1003.1.4.2` | Verified |
| &emsp;`FTR-1012.4` | Make the table workspace cleaner and denser so column naming and row creation use less space and more of the table remains visible | `IMP-1003.2.2` | Verified |
| &emsp;`FTR-1012.5` | Add a node action that opens either a compact description editor or the node’s full page for both Flowchart and Mindmap nodes | `IMP-1003.3.4`, `IMP-1003.4.5` | Verified |

## Acceptance

- Opening a project locks background scrolling and gives the overlay its own bounded scroll area.
- Card previews derive from the same persisted source as the full page and never require duplicate content entry.
- Markdown previews render safely and consistently in full and compact views.
- Table controls remain readable and accessible while reducing non-table space.
- Flowchart and Mindmap node descriptions persist independently and open through an unobtrusive node action.

## Implemented correction

| Finding | Completed result |
|---|---|
| `FTR-1012.1` | The project overlay locks background scrolling, scrolls the complete expanded document within the overlay, contains overscroll, and restores the previous body state when closed. |
| `FTR-1012.2` | Project cards derive their fixed-height, internally scrollable mini view directly from persisted full-page rich text and Markdown, with legacy card notes retained only as an empty-document fallback. |
| `FTR-1012.3` | Card Markdown uses the same React Markdown renderer as the full-page preview. |
| `FTR-1012.4` | Row and column actions share the compact table header; column setup expands only when requested and cell padding is reduced. |
| `FTR-1012.5` | Flowchart and Mindmap nodes share one persisted `pageText` value between a compact description popover and a full-page editor. |

## Verification

| Gate | Evidence |
|---|---|
| Focused tests | 7 Projects model and interaction tests passed, including compact table controls and shared node descriptions. |
| Full regression | `npm test`: 13 files and 64 tests passed on 2026-08-01. |
| Production build | `npm run build` passed on 2026-08-01. |
| Browser acceptance | Signed-in verification confirmed body scroll locking/restoration and full-page Markdown rendering as a structured card preview from the same saved value. |
| Repository checks | Markdown links and `git diff --check` passed. |
