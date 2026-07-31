# FTR-1008 - Projects Page Review

| Field | Detail |
|---|---|
| Implementation | [IMP-1003 - Projects](../../implementation-system/implementations/IMP-1003-projects.md) |
| Affected IMP work | [IMP-1003.2-1003.5](../../implementation-system/implementations/IMP-1003-projects.md#numbered-implementation) |
| Manual source title | Projects Page: FTR-1008 |
| Source file | `FTR-1008.pdf` |
| Source date | 2026-07-30 |
| Recorded | 2026-07-30 |
| Status | **Verified - 11 of 11 findings completed** |

## Findings

| Finding | Observed requirement | Affected IMP work | Status |
|---|---|---|---|
| &emsp;`FTR-1008.1` | Add a clear way to delete a project | `IMP-1003.5.1` | Verified |
| &emsp;`FTR-1008.2` | Allow projects to be reordered directly by dragging | `IMP-1003.5.2` | Verified |
| &emsp;`FTR-1008.3` | Add a dropdown for creating a Graph, Table, or Chart in the full-page project workspace | `IMP-1003.2-1003.4`, `IMP-1003.5.3` | Verified |
| &emsp;&emsp;↳ `FTR-1008.3.1` | Include project deletion in the dropdown | `IMP-1003.5.1`, `IMP-1003.5.3` | Verified |
| &emsp;&emsp;↳ `FTR-1008.3.2` | Place Table, Flowchart, and Mindmap actions on each project card and open each as a separately saved full-page workspace | `IMP-1003.5.3` | Verified |
| &emsp;&emsp;↳ `FTR-1008.3.3` | Render Flowchart and Mindmap as draggable rectangular node canvases with editable text and arrows | `IMP-1003.3.1`, `IMP-1003.4.1` | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1008.3.3.1` | Start new Mindmap rectangles blank and remove unused field controls while preserving stored legacy field data | `IMP-1003.4.1` | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1008.3.3.2` | Replace Source/Target forms with direct two-node Connect actions | `IMP-1003.3.1`, `IMP-1003.4.1` | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1008.3.3.3` | Increase the node writing area and move Connect, color, and delete controls into a compact corner menu | `IMP-1003.3.1`, `IMP-1003.4.1` | Verified |
| &emsp;&emsp;&emsp;↳ `FTR-1008.3.3.4` | Add a separate lightning action that opens each Mindmap node as an independently saved full-page workspace | `IMP-1003.4.3` | Verified |
| &emsp;`FTR-1008.4` | Make All, Active, In Progress, and Done selectable filters that show only the chosen project status | `IMP-1003.5.4` | Verified |

## Implemented correction

| Surface | Completed result |
|---|---|
| Deletion | Added confirmed irreversible deletion to project cards and the full-page Project actions menu. |
| Ordering | Added direct persisted card drag reordering without separate directional controls. |
| Full-page modes | Added a foreground menu to every project card that opens Table, Flowchart, and Object mindmap as separately persisted full-page workspaces. Flowchart and Mindmap use larger editable rectangles, draggable layouts, direct node-to-node arrows, and compact corner menus for Connect, color, and delete. A separate ⚡ action opens each Mindmap node as its own saved page. |
| Status | Standardized project status as Active, In progress, or Done and added functional All, Active, In Progress, and Done filters. |
| Persistence | Normalized legacy projects and persisted table, flowchart, mindmap, ordering, and status data through the existing workspace sync path. |

The reviewed Graph, Table, and Chart request is implemented through Table, Flowchart, and Object mindmap modes. Both mapping modes let users type inside rectangles and connect ideas by selecting Connect on two nodes.

## Verification

- Project mode suites: 2 files and 6 tests passed.
- Full suite: 12 files and 56 tests passed.
- Production build: TypeScript and Vite build passed.
- Signed-in browser: 304 px nodes with 72 px writing areas, working corner menus, a separate clickable ⚡ node-page action, persisted page content, no Source/Target selectors, and visible arrows passed with zero console errors on 2026-07-30.
