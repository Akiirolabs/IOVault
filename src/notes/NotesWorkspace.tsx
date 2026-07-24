import { useEffect, useMemo, useRef, useState } from "react";
import type { NoteCollection, NoteCollectionRow, NoteColumn, NoteColumnType, NotePage, WriteState } from "./model";
import { createTestingCollection } from "./model";

type Props = {
  write: WriteState;
  onChange: (write: WriteState) => void;
  includeAssistantContext: boolean;
  onAssistantContextChange: (include: boolean) => void;
};

function makeId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function now() {
  return new Date().toISOString();
}

function RichNoteEditor({ page, onChange }: { page: NotePage; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = page.docHtml;
  }, [page.id]);

  function format(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <>
      <div className="notes-format-bar" role="toolbar" aria-label="Note formatting">
        <button type="button" onClick={() => format("formatBlock", "h2")}>Heading</button>
        <button type="button" onClick={() => format("bold")}><strong>Bold</strong></button>
        <button type="button" onClick={() => format("italic")}><em>Italic</em></button>
        <button type="button" onClick={() => format("insertUnorderedList")}>List</button>
      </div>
      <div
        ref={ref}
        className="notes-rich-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={`${page.title} content`}
        aria-multiline="true"
        data-placeholder="Start writing…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </>
  );
}

const COLUMN_TYPE_OPTIONS: Array<{ value: NoteColumnType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Select / status" },
  { value: "url", label: "URL" },
];

function normalizeCellForType(value: string | boolean | undefined, column: NoteColumn) {
  if (column.type === "checkbox") return value === true;
  const text = typeof value === "string" ? value : "";
  if (column.type === "select" && column.options?.length && !column.options.includes(text)) return "";
  return text;
}

function compareCells(a: string | boolean | undefined, b: string | boolean | undefined, column: NoteColumn) {
  if (column.type === "number") {
    const left = Number(a);
    const right = Number(b);
    if (!Number.isNaN(left) && !Number.isNaN(right)) return left - right;
  }
  if (column.type === "checkbox") return Number(a === true) - Number(b === true);
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: column.type === "date" });
}

function CollectionEditor({ collection, onChange }: { collection: NoteCollection; onChange: (collection: NoteCollection) => void }) {
  const [showColumns, setShowColumns] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<NoteColumnType>("text");
  const [newColumnOptions, setNewColumnOptions] = useState("");
  const completedColumn = collection.columns.find((column) => column.type === "checkbox");
  const visibleRows = useMemo(() => {
    const matches = new Set(collection.rows.filter((row) => {
      if (!completedColumn || collection.view === "all") return true;
      const completed = row.cells[completedColumn.id] === true;
      return collection.view === "done" ? completed : !completed;
    }).map((row) => row.id));
    const byId = new Map(collection.rows.map((row) => [row.id, row]));
    if (collection.view !== "all") {
      for (const rowId of [...matches]) {
        let parentId = byId.get(rowId)?.parentRowId;
        while (parentId && !matches.has(parentId)) {
          matches.add(parentId);
          parentId = byId.get(parentId)?.parentRowId;
        }
      }
    }
    const children = new Map<string | undefined, NoteCollectionRow[]>();
    for (const row of collection.rows) {
      if (!matches.has(row.id)) continue;
      const parentId = row.parentRowId && matches.has(row.parentRowId) ? row.parentRowId : undefined;
      children.set(parentId, [...(children.get(parentId) ?? []), row]);
    }
    const sortColumn = collection.columns.find((item) => item.id === collection.sortColumnId);
    const direction = collection.sortDirection === "desc" ? -1 : 1;
    const sortRows = (rows: NoteCollectionRow[]) => sortColumn
      ? [...rows].sort((a, b) => compareCells(a.cells[sortColumn.id], b.cells[sortColumn.id], sortColumn) * direction)
      : rows;
    const flattened: Array<{ row: NoteCollectionRow; depth: number; hasChildren: boolean; collapsed: boolean }> = [];
    const visit = (parentId: string | undefined, depth: number) => {
      for (const row of sortRows(children.get(parentId) ?? [])) {
        const childRows = children.get(row.id) ?? [];
        const collapsed = collection.collapsedRowIds?.includes(row.id) === true;
        flattened.push({ row, depth, hasChildren: childRows.length > 0, collapsed });
        if (!collapsed) visit(row.id, depth + 1);
      }
    };
    visit(undefined, 0);
    return flattened;
  }, [collection, completedColumn]);

  function updateCell(rowId: string, columnId: string, value: string | boolean) {
    onChange({ ...collection, rows: collection.rows.map((row) => row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: value } } : row) });
  }

  function addColumn(event: React.FormEvent) {
    event.preventDefault();
    const name = newColumnName.trim();
    if (!name) return;
    const column: NoteColumn = {
      id: makeId("column"),
      name,
      type: newColumnType,
      ...(newColumnType === "select" ? { options: parseOptions(newColumnOptions) } : {}),
    };
    onChange({ ...collection, columns: [...collection.columns, column] });
    setNewColumnName("");
    setNewColumnType("text");
    setNewColumnOptions("");
  }

  function parseOptions(value: string) {
    return [...new Set(value.split(",").map((option) => option.trim()).filter(Boolean))];
  }

  function updateColumn(columnId: string, updates: Partial<NoteColumn>) {
    const previous = collection.columns.find((column) => column.id === columnId);
    if (!previous) return;
    const next = { ...previous, ...updates };
    if (next.type !== "select") delete next.options;
    const typeChanged = next.type !== previous.type || (next.type === "select" && updates.options !== undefined);
    onChange({
      ...collection,
      columns: collection.columns.map((column) => column.id === columnId ? next : column),
      rows: typeChanged ? collection.rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [columnId]: normalizeCellForType(row.cells[columnId], next) },
      })) : collection.rows,
    });
  }

  function removeColumn(columnId: string) {
    if (collection.columns.length === 1 || !window.confirm("Delete this column and its cells?")) return;
    onChange({
      ...collection,
      columns: collection.columns.filter((column) => column.id !== columnId),
      rows: collection.rows.map((row) => {
        const cells = { ...row.cells };
        delete cells[columnId];
        return { ...row, cells };
      }),
      sortColumnId: collection.sortColumnId === columnId ? undefined : collection.sortColumnId,
    });
  }

  function sortBy(columnId: string) {
    onChange({
      ...collection,
      sortColumnId: columnId,
      sortDirection: collection.sortColumnId === columnId && collection.sortDirection === "asc" ? "desc" : "asc",
    });
  }

  function addRow(parentRowId?: string) {
    onChange({ ...collection, rows: [...collection.rows, { id: makeId("row"), cells: {}, ...(parentRowId ? { parentRowId } : {}) }] });
  }

  function toggleRow(rowId: string) {
    const collapsed = new Set(collection.collapsedRowIds ?? []);
    if (collapsed.has(rowId)) collapsed.delete(rowId);
    else collapsed.add(rowId);
    onChange({ ...collection, collapsedRowIds: [...collapsed] });
  }

  function removeRow(rowId: string) {
    const parentRowId = collection.rows.find((row) => row.id === rowId)?.parentRowId;
    onChange({
      ...collection,
      rows: collection.rows.filter((row) => row.id !== rowId).map((row) => row.parentRowId === rowId ? { ...row, parentRowId } : row),
      collapsedRowIds: collection.collapsedRowIds?.filter((id) => id !== rowId),
    });
  }

  return (
    <div className="notes-collection">
      <div className="notes-collection-tools">
        <div role="group" aria-label="Collection filter">
          {(["all", "open", "done"] as const).map((view) => <button type="button" className={collection.view === view ? "active" : ""} key={view} onClick={() => onChange({ ...collection, view })}>{view}</button>)}
        </div>
        <button type="button" aria-expanded={showColumns} onClick={() => setShowColumns((value) => !value)}>{showColumns ? "Close columns" : "+ Column"}</button>
      </div>
      {showColumns && <section className="notes-column-manager" aria-label="Column settings">
        <div className="notes-column-list">
          {collection.columns.map((column) => <div className="notes-column-config" key={column.id}>
            <input aria-label={`Name for ${column.name} column`} value={column.name} onChange={(event) => updateColumn(column.id, { name: event.target.value })} />
            <select aria-label={`Type for ${column.name} column`} value={column.type} onChange={(event) => updateColumn(column.id, { type: event.target.value as NoteColumnType })}>
              {COLUMN_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {column.type === "select" && <input aria-label={`Options for ${column.name} column`} value={column.options?.join(", ") ?? ""} placeholder="Options, comma separated" onChange={(event) => updateColumn(column.id, { options: parseOptions(event.target.value) })} />}
            <button type="button" onClick={() => removeColumn(column.id)} aria-label={`Delete ${column.name} column`}>Delete</button>
          </div>)}
        </div>
        <form className="notes-column-create" onSubmit={addColumn}>
          <input aria-label="New column name" placeholder="Column name" value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} />
          <select aria-label="New column type" value={newColumnType} onChange={(event) => setNewColumnType(event.target.value as NoteColumnType)}>
            {COLUMN_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {newColumnType === "select" && <input aria-label="New column options" placeholder="Options, comma separated" value={newColumnOptions} onChange={(event) => setNewColumnOptions(event.target.value)} />}
          <button type="submit" disabled={!newColumnName.trim()}>Add column</button>
        </form>
      </section>}
      <div className="notes-table-scroll">
        <table className="notes-table">
          <thead><tr>{collection.columns.map((column) => (
            <th key={column.id}>
              <button type="button" className="notes-column-sort" onClick={() => sortBy(column.id)}>{column.name}{collection.sortColumnId === column.id ? (collection.sortDirection === "desc" ? " ↓" : " ↑") : ""}</button>
            </th>
          ))}<th aria-label="Row actions" /></tr></thead>
          <tbody>{visibleRows.map(({ row, depth, hasChildren, collapsed }, rowIndex) => <tr key={row.id} data-row-depth={depth}>{collection.columns.map((column, columnIndex) => <td key={column.id}><div className={columnIndex === 0 ? "notes-tree-cell" : undefined} style={columnIndex === 0 ? { paddingLeft: `${depth * 1.1}rem` } : undefined}>{columnIndex === 0 && (hasChildren ? (
            <button type="button" className="notes-row-toggle" aria-label={`${collapsed ? "Expand" : "Collapse"} row ${rowIndex + 1}`} aria-expanded={!collapsed} onClick={() => toggleRow(row.id)}>{collapsed ? "▸" : "▾"}</button>
          ) : <span className="notes-row-toggle-spacer" />)}{column.type === "checkbox" ? (
            <input type="checkbox" aria-label={`${column.name} for row ${rowIndex + 1}`} checked={row.cells[column.id] === true} onChange={(event) => updateCell(row.id, column.id, event.target.checked)} />
          ) : column.type === "select" ? (
            <select aria-label={`${column.name} for row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onChange={(event) => updateCell(row.id, column.id, event.target.value)}><option value="">Select…</option>{column.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          ) : (
            <input type={column.type} aria-label={`${column.name} for row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onChange={(event) => updateCell(row.id, column.id, event.target.value)} />
          )}</div></td>)}<td><div className="notes-row-actions"><button type="button" onClick={() => addRow(row.id)} aria-label={`Add subrow to row ${rowIndex + 1}`}>+↳</button><button type="button" className="notes-row-delete" onClick={() => removeRow(row.id)} aria-label={`Delete row ${rowIndex + 1}`}>×</button></div></td></tr>)}</tbody>
        </table>
      </div>
      <button type="button" className="notes-add-row" onClick={() => addRow()}>+ Add row</button>
    </div>
  );
}

export default function NotesWorkspace({ write, onChange, includeAssistantContext, onAssistantContextChange }: Props) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const active = write.pages.find((page) => page.id === write.activePageId) ?? write.pages[0];
  const visiblePages = write.pages.filter((page) => page.archived === showArchived && page.title.toLowerCase().includes(query.toLowerCase()));

  function commit(pages: NotePage[], activePageId = write.activePageId) {
    const nextActive = pages.find((page) => page.id === activePageId && !page.archived) ?? pages.find((page) => !page.archived) ?? pages[0];
    onChange({ ...write, pages, activePageId: nextActive?.id ?? "", docHtml: nextActive?.kind === "note" ? nextActive.docHtml : write.docHtml });
  }

  function updateActive(updates: Partial<NotePage>) {
    const updatedAt = now();
    commit(write.pages.map((page) => page.id === active.id ? { ...page, ...updates, updatedAt } : page));
  }

  function createPage(kind: NotePage["kind"], template?: "testing") {
    const timestamp = now();
    const page: NotePage = {
      id: makeId("note"),
      parentId: active && !active.archived ? active.id : null,
      title: template === "testing" ? "Testing Panel" : kind === "collection" ? "Untitled collection" : "Untitled note",
      kind,
      docHtml: "",
      archived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      collection: kind === "collection" ? (template === "testing" ? createTestingCollection() : { columns: [{ id: "name", name: "Name", type: "text" }], rows: [], view: "all" }) : undefined,
    };
    commit([...write.pages, page], page.id);
    setShowArchived(false);
  }

  function archiveActive() {
    if (!active || !window.confirm(`Archive “${active.title}”? You can restore it later.`)) return;
    const subtree = new Set([active.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const page of write.pages) {
        if (page.parentId && subtree.has(page.parentId) && !subtree.has(page.id)) {
          subtree.add(page.id);
          changed = true;
        }
      }
    }
    commit(write.pages.map((page) => subtree.has(page.id) ? { ...page, archived: true, updatedAt: now() } : page));
  }

  function descendantsOf(pageId: string) {
    const descendants = new Set<string>();
    let changed = true;
    while (changed) {
      changed = false;
      for (const page of write.pages) {
        if (page.parentId && (page.parentId === pageId || descendants.has(page.parentId)) && !descendants.has(page.id)) {
          descendants.add(page.id);
          changed = true;
        }
      }
    }
    return descendants;
  }

  function renderTree(parentId: string | null, depth = 0, visited = new Set<string>()): React.ReactNode {
    return visiblePages.filter((page) => page.parentId === parentId || (depth === 0 && page.parentId && !visiblePages.some((candidate) => candidate.id === page.parentId))).map((page) => (
      <div key={page.id}>
        <button type="button" className={`notes-tree-item ${page.id === active?.id ? "active" : ""}`} style={{ paddingLeft: `${0.7 + depth * 0.85}rem` }} onClick={() => commit(write.pages, page.id)}>
          <span aria-hidden="true">{page.kind === "collection" ? "▦" : "▤"}</span><span>{page.title || "Untitled"}</span>
        </button>
        {!visited.has(page.id) && renderTree(page.id, depth + 1, new Set([...visited, page.id]))}
      </div>
    ));
  }

  if (!active) return <div className="notes-empty">No notes available.</div>;

  return (
    <div className="notes-workspace">
      <aside className="notes-explorer editor-panel">
        <div className="notes-explorer-head"><div><p className="kicker">Knowledge</p><h2>Notes</h2></div><button type="button" onClick={() => createPage("note")} aria-label="New note">+</button></div>
        <input className="notes-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages" aria-label="Search notes" />
        <div className="notes-create-actions">
          <button type="button" onClick={() => createPage("note")}>Note</button>
          <button type="button" onClick={() => createPage("collection")}>Table</button>
          <button type="button" onClick={() => createPage("collection", "testing")}>Testing panel</button>
        </div>
        <nav className="notes-tree" aria-label={showArchived ? "Archived notes" : "Note pages"}>{renderTree(null)}</nav>
        <button type="button" className="notes-archive-toggle" onClick={() => setShowArchived((value) => !value)}>{showArchived ? "← Active pages" : `Archived (${write.pages.filter((page) => page.archived).length})`}</button>
      </aside>

      <section className="notes-main editor-panel">
        <header className="notes-page-head">
          <div className="notes-title-wrap"><span>{active.kind === "collection" ? "Collection" : "Page"}</span><input value={active.title} onChange={(event) => updateActive({ title: event.target.value })} aria-label="Page title" /></div>
          <div className="notes-page-actions">
            {!active.archived && <label>Parent<select value={active.parentId ?? ""} onChange={(event) => updateActive({ parentId: event.target.value || null })} aria-label="Parent page"><option value="">Top level</option>{write.pages.filter((page) => !page.archived && page.id !== active.id && !descendantsOf(active.id).has(page.id)).map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}</select></label>}
            <label className="notes-context-toggle"><input type="checkbox" checked={includeAssistantContext} onChange={(event) => onAssistantContextChange(event.target.checked)} />Use this page with AI</label>
            {active.archived ? <button type="button" onClick={() => { setShowArchived(false); updateActive({ archived: false }); }}>Restore</button> : <button type="button" onClick={archiveActive}>Archive</button>}
          </div>
        </header>
        {active.kind === "note" ? <RichNoteEditor key={active.id} page={active} onChange={(docHtml) => updateActive({ docHtml })} /> : <CollectionEditor collection={active.collection ?? { columns: [], rows: [], view: "all" }} onChange={(collection) => updateActive({ collection })} />}
      </section>
    </div>
  );
}
