# Flowchart / Node Map (Planned)

A free-form canvas where the user places **nodes** and draws **connectors** between them manually — a mindmap / flowchart style board. Second button in the project card action row.

> Distinction: this is the **manual** graph (user draws every link). The [object mindmap](./object-mindmap.md) is the **automatic** graph (links are inferred from relationships).

## Entry point

- Add a button to `.project-block-head` (e.g. icon `HiOutlineShare` or `HiOutlineMap`) next to the existing expand button.
- On click, open the shared overlay for this project in a "flowchart" screen. Suggested approach: a `screen` discriminator alongside `openProjectId`, e.g. `setOpenProjectScreen("flowchart")` + `setOpenProjectId(block.id)`, so all screens reuse one overlay shell.

## Proposed data model

```ts
type FlowNode = {
  id: string;
  x: number;          // canvas position
  y: number;
  label: string;
  color?: string;
};

type FlowEdge = {
  id: string;
  from: string;       // FlowNode.id
  to: string;         // FlowNode.id
  label?: string;
};

type FlowchartDoc = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

// on ProjectBlock:
flowchart?: FlowchartDoc;
```

Persist via `updateProject(id, { flowchart: next })`. Add a tolerant branch in `normalizeVaultState` (default `{ nodes: [], edges: [] }`).

## UX

- Toolbar: **Add node**, delete selected, edge label edit, zoom/fit, clear.
- Create a node → it appears on the canvas; drag to reposition.
- Draw an edge by dragging from one node's handle to another.
- Double-click a node/edge to rename; select + Delete to remove.

## Implementation options

- **Recommended:** [`@xyflow/react`](https://reactflow.dev) (React Flow) — handles panning, zoom, draggable nodes, and connectable handles out of the box. Store its `nodes`/`edges` (mapped to `FlowchartDoc`) in `localStorage`.
- **Dependency-free alternative:** an SVG canvas — absolutely-positioned node `<div>`s + an `<svg>` layer drawing `<path>`/`<line>` edges between node centers. More code (drag handling, hit-testing) but no new deps and matches the app's "no heavy libs" style.

## Persistence & performance

- Debounce position writes (e.g. on drag end) to avoid thrashing `localStorage` on every mouse move.
- Keep node/edge counts reasonable; this is a per-project board, not a global graph.

## Open questions

- Should edges be directed (arrowheads) or plain lines? (Recommend directed with optional arrowhead toggle.)
- Node shapes/colors — start with one rounded-rect style, add styling later.
