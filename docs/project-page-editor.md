# Project Page Editor (Implemented)

Opens a project as a full-screen document with two editing modes: **Rich Text** (WYSIWYG) and **Markdown** (edit + rendered preview). This is the first button in the project card action row.

## Entry point

- Button: `.project-open-page` inside `.project-block-head` (the expand / arrows icon, `HiOutlineArrowsPointingOut`).
- On click it runs:
  ```ts
  setProjectDocMode("rich");
  setIsMarkdownPreview(false);
  setOpenProjectId(block.id);
  ```

## UI structure (`src/App.tsx`)

- Overlay: `.project-page-overlay` (fixed, full-screen, `role="dialog"`) → `.project-page` (grid: header / toolbar / body).
- Header `.project-page-head`: `Back` button (`setOpenProjectId(null)`), editable title input, status `<select>`.
- Toolbar `.project-page-toolbar` (single row):
  - Mode buttons `.project-page-modes`: **Rich Text** / **Markdown**.
  - Format buttons `.project-page-format`: `B I U H • 1.`
  - In Markdown mode only: a **Preview / Edit** toggle (`.project-md-toggle`) on the right.
- Body `.project-page-body` (single full-width area — no split):
  - Rich Text: `RichTextEditor` (uncontrolled `contentEditable`).
  - Markdown edit: a full-width `<textarea>` (`markdownRef`).
  - Markdown preview: `<ReactMarkdown>` rendered full width.

## Behavior notes

- **Rich Text** formatting uses `document.execCommand` via `applyWriteFormat`. Buttons use `onMouseDown` + `preventDefault` so the editor keeps its selection.
- **Markdown** insert buttons call `wrapProjectMarkdown(before, after)`, which wraps the current textarea selection and restores the caret with `requestAnimationFrame`.
- **Preview toggle** (`isMarkdownPreview`) flips the same full-width body between the raw textarea and the rendered output — it is not a permanent side-by-side split.
- Rich Text and Markdown are **independent bodies** (`docHtml` vs `docMarkdown`); there is no HTML↔Markdown conversion (avoids lossy round-trips).

## Data model

```ts
// on ProjectBlock
docHtml?: string;      // rich-text HTML
docMarkdown?: string;  // markdown source
```

Persisted through `updateProject(id, { docHtml })` / `{ docMarkdown }` → `saveVaultState` → `localStorage["io-vault-workspace"]`. Missing fields default to `""` in the editor and are tolerated by `normalizeVaultState`.

## Key gotcha (reused by all future screens)

The `RichTextEditor` component is intentionally **uncontrolled**: it seeds `innerHTML` once on mount via a ref and never re-binds `dangerouslySetInnerHTML` to state. Re-binding on every keystroke resets the caret to the start and makes text render reversed. Any future rich editor must follow the same uncontrolled pattern.
