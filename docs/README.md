# IO Vault — Feature Docs & Roadmap

This folder documents IO Vault features: what exists today and what's planned. Each project on the **Projects** page can be opened into full-screen "screens" via a row of action buttons on the project card.

## The project card action row

Each project card (`.project-block` in `src/App.tsx`) has a header row (`.project-block-head`) containing the project title and a **row of action buttons**. Today that row holds one button (Open as full page). The roadmap adds three more buttons to the same row, each opening its own full-screen overlay "screen" for that project.

Planned button row (left → right), all sitting next to the title:

| Button | Opens | Status |
| --- | --- | --- |
| Open as full page (expand icon) | Rich-text + Markdown document editor | ✅ Implemented — see [`project-page-editor.md`](./project-page-editor.md) |
| Flowchart / node map | Free-form node + connector canvas (you draw the links) | 🔜 Planned — see [`flowchart-node-map.md`](./flowchart-node-map.md) |
| Data table creator | Spreadsheet-style typed table (add columns/rows, edit cells) | 🔜 Planned — see [`data-table-creator.md`](./data-table-creator.md) |
| Object mindmap | Add object blocks; connector lines are drawn automatically from relationships | 🔜 Planned — see [`object-mindmap.md`](./object-mindmap.md) |

## Platform features (not per-project)

| Feature | Description | Status |
| --- | --- | --- |
| Server, sign-in & SQL database | User accounts + a SQL backend (SQLite) that stores all user data per user, synced from the client | ✅ Implemented — see [`server-and-auth.md`](./server-and-auth.md) and [`architecture.md`](./architecture.md) |

## Shared conventions

All screens follow the same patterns as the implemented full-page editor, so the planned features should reuse them:

- **Entry point:** a `<button>` in `.project-block-head` sets an "open" state to the project's `id` and (optionally) which screen to show, e.g. `setOpenProjectId(block.id)`.
- **Overlay:** a full-screen overlay (`.project-page-overlay` → `.project-page`) with a header (`Back` button, editable title, status) and a body.
- **Persistence:** all data lives in the single `VaultState` object, serialized to `localStorage` under the key `io-vault-workspace` (see `saveVaultState` / `updateProject` in `src/App.tsx`). Each planned feature adds an **optional** field to `ProjectBlock` so existing saves stay valid (see `normalizeVaultState`).
- **No backend:** everything is client-side; no server calls are required for these screens.

## Current `ProjectBlock` shape

```ts
type ProjectBlock = {
  id: string;
  title: string;
  status: "Planned" | "In progress" | "Done";
  body: string;            // short notes on the board card
  docHtml?: string;        // full-page rich-text document (implemented)
  docMarkdown?: string;    // full-page markdown document (implemented)
  // Planned additions (all optional, added incrementally):
  // flowchart?: FlowchartDoc;
  // table?: TableDoc;
  // mindmap?: MindmapDoc;
};
```

## Implementation order (suggested)

1. **Data table creator** — lowest complexity, no graph/layout libs, pure React + state.
2. **Flowchart / node map** — introduces a canvas + manual connectors (evaluate `@xyflow/react`).
3. **Object mindmap** — builds on the flowchart canvas but adds automatic layout/edge generation (`dagre`/`elk`).

Keep each feature behind its own button and its own optional `ProjectBlock` field so they can ship independently.
