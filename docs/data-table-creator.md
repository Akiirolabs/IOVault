# Project Data Table

**Status:** planned; first project-screen expansion because v1 needs no graph dependency.

## Product intent

Each project can own a lightweight typed table for tasks, research, inventories, or structured notes. It reuses the project overlay and persists with the project rather than becoming a separate spreadsheet product.

| Decision | v1 default |
|---|---|
| Column types | Text, number, date, checkbox, select |
| Cell storage | Strings keyed by column ID; checkbox normalized consistently |
| Editing | Controlled inline inputs |
| Actions | Add/delete row and column; edit select options |
| Deferred | Sorting, reordering, formulas, CSV export |

## Proposed shape

```ts
type TableDoc = {
  columns: Array<{ id: string; name: string; type: "text" | "number" | "date" | "checkbox" | "select"; options?: string[] }>;
  rows: Array<Record<string, string>>;
};
```

Store `table?: TableDoc` on `ProjectBlock`, normalize missing data to empty arrays, remove deleted column keys from every row, and generate IDs with `crypto.randomUUID()`.

## Acceptance

- Existing projects load unchanged.
- Typed controls edit and persist correctly after reload/sign-in.
- Row/column deletion cannot leave inaccessible cell data.
- Keyboard navigation and narrow-screen horizontal scrolling remain usable.
