# FTR-1009 - Projects Follow-up Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1003 - Projects](../../implementation-system/implementations/IMP-1003-projects.md) |
| Affected IMP work | `IMP-1003.1.1`, `IMP-1003.3.2-1003.3.3`, `IMP-1003.4.2`, `IMP-1003.4.4`, `IMP-1003.5.2`, `IMP-1003.5.5`, and `IMP-1003.6` |
| Manual source title | Projects Page: FTR-1009 |
| Source file | `FTR-1009.pdf` |
| Source date | 2026-07-30 |
| Recorded | 2026-07-30 |
| Status | **Verified - 6 of 6 findings verified** |

## Findings

| Finding | Observed requirement | Affected IMP work | Status |
|---|---|---|---|
| &emsp;`FTR-1009.1` | Dismiss a full-page project workspace by clicking outside its page surface | `IMP-1003.1.1` | Verified |
| &emsp;`FTR-1009.2` | Add **Send to AI** to a project menu so selected project content becomes visible assistant context | `IMP-1003.6` | Verified |
| &emsp;`FTR-1009.3` | Move Flowchart and Mindmap nodes smoothly in real time while the pointer drags them | `IMP-1003.3.2`, `IMP-1003.4.2` | Verified |
| &emsp;`FTR-1009.4` | Make visual nodes resizable within useful minimum and maximum dimensions | `IMP-1003.3.3`, `IMP-1003.4.4` | Verified |
| &emsp;`FTR-1009.5` | Reorder project cards directly by dragging them into any position | `IMP-1003.5.2` | Verified |
| &emsp;`FTR-1009.6` | Add a menu beside **New Project** for reorganizing, sorting, or creating a project from a selectable template | `IMP-1003.5.5` | Verified |

## Implemented correction

| Area | Verified result |
|---|---|
| Full-page workspace | Clicking the shaded overlay outside the project surface dismisses the page without interfering with controls inside it. |
| AI context | **Send to AI** opens the assistant with one visible, removable project context item and submits only that project’s bounded content. |
| Visual nodes | Dedicated move handles update node position continuously during pointer movement and persist the final position. |
| Node sizing | Flowchart and Mindmap nodes use persisted width and height bounded to 180–520 pixels wide and 100–320 pixels high. |
| Card ordering | Dragging above or below a target card places the project before or after that card and persists the resulting order. |
| Organization | The control beside **New Project** provides title sorting, status grouping, and Research or Launch templates. |

## Verification

- `npm test`: 12 test files and 57 tests passed on 2026-07-30.
- `npm run build`: TypeScript and Vite production build passed on 2026-07-30.
- Browser acceptance confirmed outside-click dismissal, project-only assistant context, organization controls, template creation, and accessible move/resize controls.
