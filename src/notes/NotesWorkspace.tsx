import { useEffect, useMemo, useRef, useState } from "react";
import type { NoteCollection, NotePage, WriteState } from "./model";
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

function CollectionEditor({ collection, onChange }: { collection: NoteCollection; onChange: (collection: NoteCollection) => void }) {
  const completedColumn = collection.columns.find((column) => column.type === "checkbox");
  const visibleRows = useMemo(() => {
    let rows = collection.rows.filter((row) => {
      if (!completedColumn || collection.view === "all") return true;
      const completed = row.cells[completedColumn.id] === true;
      return collection.view === "done" ? completed : !completed;
    });
    if (collection.sortColumnId) {
      const direction = collection.sortDirection === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => String(a.cells[collection.sortColumnId!] ?? "").localeCompare(String(b.cells[collection.sortColumnId!] ?? "")) * direction);
    }
    return rows;
  }, [collection, completedColumn]);

  function updateCell(rowId: string, columnId: string, value: string | boolean) {
    onChange({ ...collection, rows: collection.rows.map((row) => row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: value } } : row) });
  }

  function addColumn() {
    const name = window.prompt("Column name")?.trim();
    if (!name) return;
    const type = window.confirm("Use a checkbox column? Select Cancel for text.") ? "checkbox" : "text";
    onChange({ ...collection, columns: [...collection.columns, { id: makeId("column"), name, type }] });
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

  return (
    <div className="notes-collection">
      <div className="notes-collection-tools">
        <div role="group" aria-label="Collection filter">
          {(["all", "open", "done"] as const).map((view) => <button type="button" className={collection.view === view ? "active" : ""} key={view} onClick={() => onChange({ ...collection, view })}>{view}</button>)}
        </div>
        <button type="button" onClick={addColumn}>+ Column</button>
      </div>
      <div className="notes-table-scroll">
        <table className="notes-table">
          <thead><tr>{collection.columns.map((column) => (
            <th key={column.id}>
              <button type="button" className="notes-column-sort" onClick={() => sortBy(column.id)}>{column.name}{collection.sortColumnId === column.id ? (collection.sortDirection === "desc" ? " ↓" : " ↑") : ""}</button>
              <button type="button" className="notes-column-delete" onClick={() => removeColumn(column.id)} aria-label={`Delete ${column.name} column`}>×</button>
            </th>
          ))}<th aria-label="Row actions" /></tr></thead>
          <tbody>{visibleRows.map((row) => <tr key={row.id}>{collection.columns.map((column) => <td key={column.id}>{column.type === "checkbox" ? (
            <input type="checkbox" aria-label={`${column.name} for row`} checked={row.cells[column.id] === true} onChange={(event) => updateCell(row.id, column.id, event.target.checked)} />
          ) : (
            <input aria-label={`${column.name} for row`} value={String(row.cells[column.id] ?? "")} onChange={(event) => updateCell(row.id, column.id, event.target.value)} />
          )}</td>)}<td><button type="button" className="notes-row-delete" onClick={() => onChange({ ...collection, rows: collection.rows.filter((item) => item.id !== row.id) })} aria-label="Delete row">×</button></td></tr>)}</tbody>
        </table>
      </div>
      <button type="button" className="notes-add-row" onClick={() => onChange({ ...collection, rows: [...collection.rows, { id: makeId("row"), cells: {} }] })}>+ Add row</button>
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
