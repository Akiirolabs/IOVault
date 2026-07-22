# IMP-1004 — Projects

**State:** Partial · **Priority:** P2

| Capability | State | Source |
|---|---|---|
| Project cards and status | Available | Current app |
| Rich-text / Markdown full-page editor | Implemented | [Plan](../../project-page-editor.md) |
| Typed project table | Planned next | [Plan](../../data-table-creator.md) |
| Manual flowchart | Planned | [Plan](../../flowchart-node-map.md) |
| Automatic object mindmap | Planned | [Plan](../../object-mindmap.md) |

## Steps

1. Add versioned typed table data with safe migration and cleanup on column deletion.
2. Reuse one project overlay contract for table, flowchart, and mindmap modes.
3. Implement manual nodes/edges and persist positions on drag completion.
4. Implement object relationships with derived edges and deterministic layout.

**Acceptance:** all project modes persist through account sync; existing projects load unchanged; keyboard and narrow-screen workflows work; graph deletion cannot leave orphaned references.

## Engineering dependencies

Workspace growth, sync conflicts, rich-text safety, and new dependency review are owned by [DBG-1006, DBG-1007, DBG-1010, and DBG-1012](../engineering-dependencies.md).
