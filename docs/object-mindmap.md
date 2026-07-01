# Object Mindmap — Auto-Connecting Blocks (Planned)

An object-oriented mindmap: the user adds **blocks** (objects) and defines relationships between them; the connector **lines are drawn automatically** by a layout engine — the user does not draw edges by hand. Fourth button in the project card action row.

> Distinction: the [flowchart / node map](./flowchart-node-map.md) is manual (drag to connect). This screen is automatic — links come from each block's declared relationships and are laid out/rendered for you.

## Entry point

- Add a button to `.project-block-head` (e.g. icon `HiOutlineCubeTransparent` or `HiOutlineRectangleGroup`) next to the other action buttons.
- Opens the shared overlay for this project in a "mindmap" screen (`setOpenProjectScreen("mindmap")`).

## Proposed data model

Relationships are stored **on the blocks**; positions and edges are computed, not stored (or cached only).

```ts
type MindmapBlock = {
  id: string;
  title: string;
  parentId?: string;       // primary hierarchical link
  linkIds?: string[];      // additional non-hierarchical relations
  fields?: Array<{ key: string; value: string }>;  // object-style properties
};

type MindmapDoc = {
  blocks: MindmapBlock[];
  rootId?: string;
};

// on ProjectBlock:
mindmap?: MindmapDoc;
```

Persist via `updateProject(id, { mindmap: next })`. Default `{ blocks: [] }` in `normalizeVaultState`.

## Auto-connection behavior (the core idea)

- The user adds a block and picks its `parentId` (and optional `linkIds`). They never place nodes or draw lines manually.
- On every render, derive edges from the blocks:
  - `parentId` → a hierarchy edge (block → parent).
  - each `linkId` → a relation edge.
- Run an **automatic layout** to compute `{x, y}` for each block, then draw connectors between the computed positions. Re-running layout after add/remove keeps the map tidy without manual dragging.

## Implementation options

- **Recommended:** [`@xyflow/react`](https://reactflow.dev) for rendering + a layout lib for positions:
  - [`dagre`](https://github.com/dagrejs/dagre) (simple hierarchical/tree layout) or
  - [`elkjs`](https://github.com/kieler/elkjs) (richer layered layouts).
  Pipeline: blocks/relations → build graph → run layout → feed positioned nodes + auto-generated edges into React Flow (nodes non-draggable, or drag allowed but layout re-flows on structure change).
- **Dependency-free alternative:** if only strict hierarchies are needed, implement a tree layout by hand (assign depth from `parentId`, space siblings evenly) and draw SVG connectors between parent/child centers. Good enough for a pure tree; use a lib once arbitrary `linkIds` (cross-links) are involved.

## UX

- Toolbar: **Add block**, set/change parent, add relation link, edit fields, delete block, **re-layout** / fit.
- Add a block → choose its parent (or make it the root) → the line to the parent appears automatically and the map re-lays out.
- Editing an object's `fields` shows key/value properties inside the block (the "object oriented" part).

## Open questions

- Layout direction (top-down tree vs left-right)? Recommend top-down default with a toggle.
- Cycle handling for `linkIds` (auto layout must tolerate non-tree edges) — `elk`/`dagre` handle general graphs; a hand-rolled tree layout does not.
- Whether to cache computed positions for stability across sessions, or always recompute on open (recompute is simpler and always tidy).
