# IMP-1003 — Projects

**State:** Partial · **Priority:** P2

## Rollouts

| Child | Rollout | Status |
|---|---|---|
| `IMP-1003.1` | Full-page editor | Implemented |
| `IMP-1003.2` | Typed table | Planned |
| `IMP-1003.3` | Flowchart | Planned |
| `IMP-1003.4` | Object mindmap | Planned |

| Sub-code | Outcome | Status |
|---|---|---|
| `IMP-1003.1.1` | Shared full-screen project overlay | Implemented |
| `IMP-1003.1.2` | Independent rich-text and Markdown documents with preview | Implemented |
| `IMP-1003.1.3` | Persist title, status, `docHtml`, and `docMarkdown` | Implemented |
| `IMP-1003.2.1` | Versioned text, number, date, checkbox, and select columns | Planned |
| `IMP-1003.2.2` | Inline row/column editing, select options, deletion cleanup, and sync | Planned |
| `IMP-1003.3.1` | Manual nodes, directed edges, labels, colors, zoom, and fit | Planned |
| `IMP-1003.3.2` | Persist drag positions and remove orphaned edges | Planned |
| `IMP-1003.4.1` | Object, parent, relation, and key/value model | Planned |
| `IMP-1003.4.2` | Derived edges, cycle validation, deterministic automatic layout, and fit | Planned |

| Capability | State |
|---|---|
| Project cards and status | Available |
| Rich-text / Markdown full-page editor | Implemented |
| Typed project table | Planned next |
| Manual flowchart | Planned after table |
| Automatic object mindmap | Planned after flowchart |

## Steps

1. Add versioned typed table data with safe migration and cleanup on column deletion.
2. Reuse one project overlay contract for table, flowchart, and mindmap modes.
3. Implement manual nodes/edges and persist positions on drag completion.
4. Implement object relationships with derived edges and deterministic layout.

**Acceptance:** all project modes persist through account sync; existing projects load unchanged; keyboard and narrow-screen workflows work; graph deletion cannot leave orphaned references.

## `IMP-1003.1` — Full-page editor

The first project-card action opens a shared full-screen overlay with independent Rich Text and Markdown documents.

| Area | Behavior |
|---|---|
| Entry | Expand action selects the project, Rich Text mode, and edit view |
| Header | Back, editable title, and project status |
| Rich Text | Uncontrolled `contentEditable` with formatting controls |
| Markdown | Full-width source editor with edit/preview toggle |
| Persistence | `docHtml` and `docMarkdown` update `ProjectBlock` and normal workspace sync |

Rich Text and Markdown stay separate to avoid lossy conversion. The uncontrolled rich editor preserves the caret; sanitization remains owned by DBG-1011.

```mermaid
flowchart LR
  Card["Project card"] --> Overlay["Shared full-screen overlay"]
  Overlay --> Rich["Rich Text: docHtml"]
  Overlay --> MD["Markdown: docMarkdown"]
  MD --> Preview["Rendered preview"]
  Rich --> Save["updateProject"]
  MD --> Save
```

## `IMP-1003.2` — Typed data table

| Decision | v1 default |
|---|---|
| Column types | Text, number, date, checkbox, select |
| Cell storage | Values keyed by column ID; checkbox normalized consistently |
| Editing | Controlled inline inputs |
| Actions | Add/delete row and column; edit select options |
| Deferred | Formulas, CSV export, and spreadsheet-scale behavior |

```ts
type TableDoc = {
  columns: Array<{ id: string; name: string; type: "text" | "number" | "date" | "checkbox" | "select"; options?: string[] }>;
  rows: Array<Record<string, string>>;
};
```

Store `table?: TableDoc` on `ProjectBlock`, normalize missing data, and remove deleted column keys from every row. Existing projects must load unchanged; typed edits and row/column deletion must survive reload and account sync.

## `IMP-1003.3` — Manual flowchart

Users position nodes and explicitly draw connectors.

| Area | v1 direction |
|---|---|
| Nodes | ID, x/y position, label, optional color |
| Edges | ID, source, target, optional label; directed by default |
| Editing | Add, drag, connect, rename, delete, zoom, fit |
| Persistence | Store nodes/edges; commit positions on drag end |

```mermaid
flowchart LR
  Add["Add node"] --> Place["Drag into position"]
  Place --> Connect["Draw connector"]
  Connect --> Persist["Persist nodes + edges"]
```

Use `@xyflow/react` unless dependency review rejects it. Deleting a node must remove its edges; keyboard deletion, focus, zoom, and narrow-screen behavior require acceptance coverage.

## `IMP-1003.4` — Object mindmap

Users edit objects and relationships; the renderer derives edges and positions automatically.

| Area | v1 direction |
|---|---|
| Object | ID, title, optional parent, relation IDs, key/value fields |
| Layout | Top-down default with re-layout and fit actions |
| Rendering | React Flow plus Dagre for the first hierarchical version |
| Persistence | Store blocks and relationships; recompute positions on open |
| Validation | Prevent missing references and identify/reject parent cycles |

```mermaid
flowchart LR
  Objects["Blocks + relationships"] --> Edges["Derive hierarchy and cross-links"]
  Edges --> Layout["Automatic layout"]
  Layout --> Render["Nodes + connectors"]
```

```ts
type MindmapDoc = {
  blocks: Array<{ id: string; title: string; parentId?: string; linkIds?: string[]; fields?: Array<{ key: string; value: string }> }>;
  rootId?: string;
};
```

Relationship changes cannot leave orphaned references. Layout should remain deterministic enough to avoid disorienting movement, and saved object data must survive reload even when positions are recomputed.

## Engineering dependencies

Workspace growth, sync conflicts, rich-text safety, and dependency review are owned by the SEC/SYS records linked in the consolidated [implementation index](../README.md).
