# Data Table Creator (Planned)

A spreadsheet / database-style table builder per project: define typed **columns**, add **rows**, and edit **cells** inline. Third button in the project card action row.

## Entry point

- Add a button to `.project-block-head` (e.g. icon `HiOutlineTableCells`) next to the other action buttons.
- Opens the shared overlay for this project in a "table" screen (`setOpenProjectScreen("table")`).

## Proposed data model

```ts
type ColumnType = "text" | "number" | "date" | "checkbox" | "select";

type TableColumn = {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[];   // for type "select"
};

type TableDoc = {
  columns: TableColumn[];
  rows: Array<Record<string, string>>;  // keyed by column id
};

// on ProjectBlock:
table?: TableDoc;
```

Persist via `updateProject(id, { table: next })`. Default `{ columns: [], rows: [] }` in `normalizeVaultState`.

## UX

- Toolbar: **Add column** (name + type picker), **Add row**, delete column/row.
- Render an HTML `<table>`; cells are inline-editable inputs whose control matches the column `type`:
  - `text`/`number`/`date` → `<input type=...>`
  - `checkbox` → `<input type="checkbox">`
  - `select` → `<select>` populated from `options`
- Editing a cell calls `updateProject` to write back into `table.rows`.
- Optional niceties (later): reorder columns, sort by column, CSV export.

## Implementation notes

- Pure React + state; **no new dependencies** needed for v1.
- Keep cell components controlled by the `TableDoc` in `VaultState`; write on change (debounce text inputs if needed).
- Generate ids with `crypto.randomUUID()` (already used elsewhere in `src/App.tsx`).

## Open questions

- Do we need typed validation (e.g. reject non-numbers in a number column)? Start lenient (store strings), add validation later.
- Column deletion should also strip that column's key from every row.
