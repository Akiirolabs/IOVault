import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NoteCollection, NoteCollectionRow, NoteColumn, NoteColumnType, NotePage, NoteRowHighlight, NoteTemplate, WriteState } from "./model";
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

function cloneCollection(collection?: NoteCollection) {
  return collection ? JSON.parse(JSON.stringify(collection)) as NoteCollection : undefined;
}

function importedTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "Imported page";
}

const PAGE_ICONS = ["📄", "📝", "📌", "✅", "💡", "📚", "🗂️", "🚀", "🎯", "⭐", "🔖", "📊", "📅", "🧠", "🔧", "🌱"];

function pageIcon(page: NotePage) {
  return page.icon || (page.kind === "collection" ? "▦" : "▤");
}

function escapedDocument(text: string) {
  return `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>")}</p>`;
}

function cleanPastedHtml(html: string) {
  const documentCopy = new DOMParser().parseFromString(html, "text/html");
  documentCopy.querySelectorAll("script, style, link, meta, iframe, object, embed").forEach((element) => element.remove());
  documentCopy.body.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.removeAttribute("class");
    element.removeAttribute("id");
    for (const attribute of [...element.attributes]) {
      if (attribute.name.toLowerCase().startsWith("on")) element.removeAttribute(attribute.name);
    }
    for (const property of Array.from(element.style)) {
      if (property.startsWith("background")) element.style.removeProperty(property);
    }
    if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
  });
  return documentCopy.body.innerHTML;
}

function parseCsv(text: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = "";
    } else field += character;
  }
  record.push(field);
  if (record.some((value) => value.length > 0)) records.push(record);
  return records;
}

type NoteFormatAction = {
  label: string;
  shortLabel: string;
  command: string;
  value?: string;
  group: "Text" | "Formatting" | "Lists and blocks" | "History";
};

const NOTE_FORMAT_ACTIONS: NoteFormatAction[] = [
  { label: "Text", shortLabel: "T", command: "formatBlock", value: "p", group: "Text" },
  { label: "H1", shortLabel: "H1", command: "formatBlock", value: "h1", group: "Text" },
  { label: "H2", shortLabel: "H2", command: "formatBlock", value: "h2", group: "Text" },
  { label: "Bold", shortLabel: "B", command: "bold", group: "Formatting" },
  { label: "Italic", shortLabel: "I", command: "italic", group: "Formatting" },
  { label: "Underline", shortLabel: "U", command: "underline", group: "Formatting" },
  { label: "Strikethrough", shortLabel: "S", command: "strikeThrough", group: "Formatting" },
  { label: "Clear", shortLabel: "Clear", command: "removeFormat", group: "Formatting" },
  { label: "Bullets", shortLabel: "• List", command: "insertUnorderedList", group: "Lists and blocks" },
  { label: "Numbered", shortLabel: "1. List", command: "insertOrderedList", group: "Lists and blocks" },
  { label: "Quote", shortLabel: "Quote", command: "formatBlock", value: "blockquote", group: "Lists and blocks" },
  { label: "Code", shortLabel: "Code", command: "formatBlock", value: "pre", group: "Lists and blocks" },
  { label: "Undo", shortLabel: "Undo", command: "undo", group: "History" },
  { label: "Redo", shortLabel: "Redo", command: "redo", group: "History" },
];

function RichNoteEditor({ page, onChange }: { page: NotePage; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showHoverToolbar, setShowHoverToolbar] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = page.docHtml;
  }, [page.id]);

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setShowFormatMenu(false);
        setShowHoverToolbar(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowFormatMenu(false);
    }
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function format(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
    setShowFormatMenu(false);
  }

  return (
    <div
      ref={shellRef}
      className="notes-rich-editor-shell"
    >
      <div className="notes-editor-controls" onMouseEnter={() => setShowHoverToolbar(true)} onMouseLeave={() => { if (!showFormatMenu) setShowHoverToolbar(false); }} onFocusCapture={() => setShowHoverToolbar(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !showFormatMenu) setShowHoverToolbar(false); }}>
        <button
          type="button"
          className="notes-format-add"
          aria-label="Open insert and formatting menu"
          aria-haspopup="menu"
          aria-expanded={showFormatMenu}
          onClick={() => setShowFormatMenu((current) => !current)}
        >+</button>
        {showHoverToolbar && !showFormatMenu && <div className="notes-format-bar" role="toolbar" aria-label="Note formatting">
          {NOTE_FORMAT_ACTIONS.map((action) => <button
            type="button"
            key={action.label}
            aria-label={action.label}
            title={action.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format(action.command, action.value)}
          >{action.shortLabel}</button>)}
        </div>}
        {showFormatMenu && <div className="notes-format-menu" role="menu" aria-label="Insert and formatting">
          {(["Text", "Formatting", "Lists and blocks", "History"] as const).map((group) => <section key={group} aria-label={group}>
            <p>{group}</p>
            <div>
              {NOTE_FORMAT_ACTIONS.filter((action) => action.group === group).map((action) => <button
                type="button"
                role="menuitem"
                key={action.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => format(action.command, action.value)}
              ><span aria-hidden="true">{action.shortLabel}</span>{action.label}</button>)}
            </div>
          </section>)}
        </div>}
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
        onPaste={(event) => {
          event.preventDefault();
          const html = event.clipboardData.getData("text/html");
          const text = event.clipboardData.getData("text/plain");
          document.execCommand(html ? "insertHTML" : "insertText", false, html ? cleanPastedHtml(html) : text);
          onChange(event.currentTarget.innerHTML);
        }}
      />
    </div>
  );
}

const COLUMN_TYPE_OPTIONS: Array<{ value: NoteColumnType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percent", label: "Percent" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Select / status" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "page", label: "Page" },
  { value: "formula", label: "Formula" },
  { value: "relation", label: "Relation" },
];

const ROW_HIGHLIGHT_OPTIONS: Array<{ value: NoteRowHighlight; label: string }> = [
  { value: "cyan", label: "Cyan" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
];

function normalizeCellForType(value: string | boolean | undefined, column: NoteColumn) {
  if (column.type === "checkbox") return value === true;
  if (column.type === "page" || column.type === "relation" || column.type === "formula") return "";
  const text = typeof value === "string" ? value : "";
  if (column.type === "select" && column.options?.length && !column.options.includes(text)) return "";
  return text;
}

function compareCells(a: string | boolean | undefined, b: string | boolean | undefined, column: NoteColumn) {
  if (["number", "currency", "percent", "formula"].includes(column.type)) {
    const left = Number(a);
    const right = Number(b);
    if (!Number.isNaN(left) && !Number.isNaN(right)) return left - right;
  }
  if (column.type === "checkbox") return Number(a === true) - Number(b === true);
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: column.type === "date" });
}

function CollectionEditor({ collection, currentPageId, pages, onChange, onCreatePageCell, onOpenPage }: { collection: NoteCollection; currentPageId: string; pages: NotePage[]; onChange: (collection: NoteCollection) => void; onCreatePageCell: (rowId: string, columnId: string) => void; onOpenPage: (rowId: string, columnId: string) => void }) {
  const [showColumns, setShowColumns] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<NoteColumnType>("text");
  const [newColumnOptions, setNewColumnOptions] = useState<string[]>([]);
  const [newColumnOptionDraft, setNewColumnOptionDraft] = useState("");
  const [columnMenuId, setColumnMenuId] = useState<string | null>(null);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [relationMenu, setRelationMenu] = useState<{ rowId: string; columnId: string; top: number; left: number } | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".notes-column-header, .notes-row-actions, .notes-inline-row-actions, .notes-context-menu, .notes-relation-trigger, .notes-relation-menu")) return;
      setColumnMenuId(null);
      setRowMenu(null);
      setRelationMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setColumnMenuId(null);
      setRowMenu(null);
      setRelationMenu(null);
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
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
      ...(newColumnType === "select" ? { options: newColumnOptions } : {}),
    };
    onChange({ ...collection, columns: [...collection.columns, column] });
    setNewColumnName("");
    setNewColumnType("text");
    setNewColumnOptions([]);
    setNewColumnOptionDraft("");
  }

  function commitOption(value: string, options: string[], update: (options: string[]) => void) {
    const option = value.trim();
    if (option && !options.includes(option)) update([...options, option]);
  }

  function updateColumn(columnId: string, updates: Partial<NoteColumn>) {
    const previous = collection.columns.find((column) => column.id === columnId);
    if (!previous) return;
    const next = { ...previous, ...updates };
    if (next.type !== "select") delete next.options;
    if (next.type !== "formula") delete next.formula;
    if (next.type !== "relation") delete next.relationPageId;
    const typeChanged = next.type !== previous.type || (next.type === "select" && updates.options !== undefined) || (next.type === "relation" && updates.relationPageId !== undefined);
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
    const pageCells = Object.fromEntries(Object.entries(collection.pageCells ?? {}).filter(([key]) => !key.endsWith(`:${columnId}`)));
    onChange({
      ...collection,
      columns: collection.columns.filter((column) => column.id !== columnId),
      rows: collection.rows.map((row) => {
        const cells = { ...row.cells };
        delete cells[columnId];
        return { ...row, cells };
      }),
      sortColumnId: collection.sortColumnId === columnId ? undefined : collection.sortColumnId,
      ...(Object.keys(pageCells).length ? { pageCells } : { pageCells: undefined }),
    });
  }

  function sortBy(columnId: string) {
    onChange({
      ...collection,
      sortColumnId: columnId,
      sortDirection: collection.sortColumnId === columnId && collection.sortDirection === "asc" ? "desc" : "asc",
    });
  }

  function sortByDirection(columnId: string, sortDirection: "asc" | "desc") {
    onChange({ ...collection, sortColumnId: columnId, sortDirection });
    setColumnMenuId(null);
  }

  function moveToNextRow(event: React.KeyboardEvent<HTMLElement>, rowIndex: number, columnId: string) {
    if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
    const nextRow = visibleRows[rowIndex + 1]?.row;
    if (!nextRow) return;
    event.preventDefault();
    rowRefs.current.get(nextRow.id)?.querySelector<HTMLElement>(`[data-column-id="${columnId}"]`)?.focus();
  }

  function formulaValue(row: NoteCollectionRow, column: NoteColumn) {
    const expression = (column.formula ?? "").replace(/\{([^}]+)\}/g, (_match, name: string) => {
      const source = collection.columns.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
      const value = source ? Number(row.cells[source.id]) : 0;
      return Number.isFinite(value) ? String(value) : "0";
    });
    if (!expression.trim() || !/^[\d\s+\-*/().,%A-Za-z]+$/.test(expression)) return "—";
    try {
      const tokens = expression.match(/\d+(?:\.\d+)?|[A-Za-z]+|[(),+\-*/%]/g) ?? [];
      let index = 0;
      function primary(): number {
        const token = tokens[index++];
        if (token === "(") { const value = sum(); if (tokens[index++] !== ")") throw new Error(); return value; }
        if (token === "-") return -primary();
        if (token && /^[A-Za-z]+$/.test(token) && tokens[index] === "(") {
          index += 1;
          const args: number[] = [];
          if (tokens[index] !== ")") {
            do { args.push(sum()); } while (tokens[index] === "," && ++index);
          }
          if (tokens[index++] !== ")" || args.length === 0) throw new Error();
          switch (token.toUpperCase()) {
            case "SUM": return args.reduce((total, value) => total + value, 0);
            case "AVERAGE": case "AVG": return args.reduce((total, value) => total + value, 0) / args.length;
            case "MIN": return Math.min(...args);
            case "MAX": return Math.max(...args);
            case "ROUND": return Number(args[0].toFixed(Math.max(0, Math.min(6, Math.trunc(args[1] ?? 0)))));
            case "ABS": return Math.abs(args[0]);
            default: throw new Error();
          }
        }
        const value = Number(token);
        if (!Number.isFinite(value)) throw new Error();
        return value;
      }
      function product(): number { let value = primary(); while (["*", "/", "%"].includes(tokens[index])) { const operator = tokens[index++]; const right = primary(); value = operator === "*" ? value * right : operator === "/" ? value / right : value % right; } return value; }
      function sum(): number { let value = product(); while (["+", "-"].includes(tokens[index])) { const operator = tokens[index++]; const right = product(); value = operator === "+" ? value + right : value - right; } return value; }
      const result = sum();
      return index === tokens.length && Number.isFinite(result) ? String(Number(result.toFixed(6))) : "—";
    } catch { return "—"; }
  }

  function appendFormula(column: NoteColumn, token: string) {
    const current = column.formula ?? "";
    const separator = current && !/[\s(]$/.test(current) && !/^[),]$/.test(token) ? " " : "";
    updateColumn(column.id, { formula: `${current}${separator}${token}` });
  }

  function openRelationMenu(event: React.MouseEvent<HTMLButtonElement>, rowId: string, columnId: string) {
    const rect = event.currentTarget.getBoundingClientRect();
    setRelationMenu({ rowId, columnId, top: Math.min(window.innerHeight - 260, rect.bottom + 6), left: Math.max(8, Math.min(window.innerWidth - 250, rect.left)) });
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
    if (!window.confirm("Delete this row? Its subrows will move up one level.")) return;
    const parentRowId = collection.rows.find((row) => row.id === rowId)?.parentRowId;
    const removedIds = new Set([rowId]);
    const pageCells = Object.fromEntries(Object.entries(collection.pageCells ?? {}).filter(([key]) => !removedIds.has(key.split(":")[0])));
    onChange({
      ...collection,
      rows: collection.rows.filter((row) => row.id !== rowId).map((row) => row.parentRowId === rowId ? { ...row, parentRowId } : row),
      collapsedRowIds: collection.collapsedRowIds?.filter((id) => id !== rowId),
      ...(Object.keys(pageCells).length ? { pageCells } : { pageCells: undefined }),
    });
  }

  function updateRowHighlight(rowId: string, highlightColor?: NoteRowHighlight) {
    onChange({
      ...collection,
      rows: collection.rows.map((row) => row.id === rowId
        ? { ...row, ...(highlightColor ? { highlightColor } : { highlightColor: undefined }) }
        : row),
    });
    setRowMenu(null);
  }

  function renameRow(rowId: string) {
    setRowMenu(null);
    const target = rowRefs.current.get(rowId)?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("input:not([type='checkbox']), select, .notes-page-cell");
    target?.focus();
    if (target instanceof HTMLInputElement) target.select();
  }

  function openRowMenu(event: React.MouseEvent<HTMLButtonElement>, rowId: string) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 190;
    setColumnMenuId(null);
    setRowMenu((current) => current?.id === rowId ? null : {
      id: rowId,
      top: Math.min(window.innerHeight - 280, rect.bottom + 6),
      left: Math.max(8, Math.min(window.innerWidth - width - 8, rect.left)),
    });
  }

  function resizeColumn(columnId: string, event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const column = collection.columns.find((item) => item.id === columnId);
    if (!column) return;
    const startX = event.clientX;
    const startWidth = column.width ?? 160;
    const move = (moveEvent: PointerEvent) => updateColumn(columnId, { width: Math.max(120, Math.min(720, startWidth + moveEvent.clientX - startX)) });
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  const menuRow = rowMenu ? visibleRows.find(({ row }) => row.id === rowMenu.id)?.row : undefined;

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
            {column.type === "select" && <div className="notes-status-options"><div>{column.options?.map((option) => <span key={option}>{option}<button type="button" aria-label={`Remove ${option} from ${column.name}`} onClick={() => updateColumn(column.id, { options: column.options?.filter((item) => item !== option) })}>×</button></span>)}</div><input aria-label={`Add option to ${column.name} column`} placeholder="Type an option and press Enter" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitOption(event.currentTarget.value, column.options ?? [], (options) => updateColumn(column.id, { options })); event.currentTarget.value = ""; } }} /></div>}
            {column.type === "relation" && <select aria-label={`Source table for ${column.name}`} value={column.relationPageId ?? ""} onChange={(event) => updateColumn(column.id, { relationPageId: event.target.value })}><option value="">Choose source table…</option>{pages.filter((page) => !page.archived && page.kind === "collection").map((page) => <option key={page.id} value={page.id}>{page.id === currentPageId ? `${page.title} (this table)` : page.title}</option>)}</select>}
          </div>)}
        </div>
        <form className="notes-column-create" onSubmit={addColumn}>
          <input aria-label="New column name" placeholder="Column name" value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} />
          <select aria-label="New column type" value={newColumnType} onChange={(event) => setNewColumnType(event.target.value as NoteColumnType)}>
            {COLUMN_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {newColumnType === "select" && <div className="notes-status-options"><div>{newColumnOptions.map((option) => <span key={option}>{option}<button type="button" aria-label={`Remove new option ${option}`} onClick={() => setNewColumnOptions((items) => items.filter((item) => item !== option))}>×</button></span>)}</div><input aria-label="New column option" placeholder="Type an option and press Enter" value={newColumnOptionDraft} onChange={(event) => setNewColumnOptionDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitOption(newColumnOptionDraft, newColumnOptions, setNewColumnOptions); setNewColumnOptionDraft(""); } }} /></div>}
          <button type="submit" disabled={!newColumnName.trim()}>Add column</button>
        </form>
      </section>}
      {editingColumnId && collection.columns.find((column) => column.id === editingColumnId) && ((column) => <section className="notes-column-manager notes-column-editor" aria-label={`Edit ${column.name} column`}>
        <header><strong>Edit column</strong><button type="button" onClick={() => setEditingColumnId(null)} aria-label="Close column editor">×</button></header>
        <input aria-label={`Edit ${column.name} name`} value={column.name} onChange={(event) => updateColumn(column.id, { name: event.target.value })} />
        <select aria-label={`Edit ${column.name} type`} value={column.type} onChange={(event) => updateColumn(column.id, { type: event.target.value as NoteColumnType })}>{COLUMN_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        {column.type === "select" && <div className="notes-status-options"><div>{column.options?.map((option) => <span key={option}>{option}<button type="button" aria-label={`Remove ${option} from ${column.name}`} onClick={() => updateColumn(column.id, { options: column.options?.filter((item) => item !== option) })}>×</button></span>)}</div><input aria-label={`Add option to ${column.name} column`} placeholder="Type an option and press Enter" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitOption(event.currentTarget.value, column.options ?? [], (options) => updateColumn(column.id, { options })); event.currentTarget.value = ""; } }} /></div>}
        {column.type === "relation" && <div className="notes-relation-config"><label>Source table<select aria-label={`Edit source table for ${column.name}`} value={column.relationPageId ?? ""} onChange={(event) => updateColumn(column.id, { relationPageId: event.target.value })}><option value="">Choose a table…</option>{pages.filter((page) => !page.archived && page.kind === "collection").map((page) => <option key={page.id} value={page.id}>{page.id === currentPageId ? `${page.title} (this table)` : page.title}</option>)}</select></label><small>Each cell will link to a record from this table.</small></div>}
        {column.type === "formula" && <div className="notes-formula-config"><input aria-label={`Formula for ${column.name}`} value={column.formula ?? ""} placeholder="Example: ROUND({Price} * {Quantity}, 2)" onChange={(event) => updateColumn(column.id, { formula: event.target.value })} /><div className="notes-formula-tokens" aria-label="Formula builder"><div>{collection.columns.filter((item) => item.id !== column.id && ["number", "currency", "percent"].includes(item.type)).map((item) => <button type="button" key={item.id} onClick={() => appendFormula(column, `{${item.name}}`)}>{item.name}</button>)}</div><div>{["+", "-", "*", "/", "(", ")"].map((operator) => <button type="button" key={operator} onClick={() => appendFormula(column, operator)}>{operator}</button>)}</div><div>{["SUM", "AVERAGE", "MIN", "MAX", "ROUND", "ABS"].map((name) => <button type="button" key={name} onClick={() => appendFormula(column, `${name}(`)}>{name}</button>)}</div></div><small>Use the builder or type column names in braces. Functions support comma-separated values.</small></div>}
      </section>)(collection.columns.find((column) => column.id === editingColumnId)!)}
      <div className="notes-table-scroll">
        <table className="notes-table">
          <thead><tr>{collection.columns.map((column) => (
            <th key={column.id} className="notes-column-header" style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}>
              <div className="notes-column-header-main">
                {renamingColumnId === column.id ? <input
                  autoFocus
                  className="notes-column-rename"
                  aria-label={`Rename ${column.name} column`}
                  value={column.name}
                  onChange={(event) => updateColumn(column.id, { name: event.target.value })}
                  onBlur={() => setRenamingColumnId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Escape") setRenamingColumnId(null);
                  }}
                /> : <button type="button" className="notes-column-sort" onClick={() => sortBy(column.id)}>{column.name}{collection.sortColumnId === column.id ? (collection.sortDirection === "desc" ? " ↓" : " ↑") : ""}</button>}
                <button type="button" className="notes-column-menu-trigger" aria-haspopup="menu" aria-expanded={columnMenuId === column.id} aria-label={`Column actions for ${column.name}`} onClick={() => { setRowMenu(null); setColumnMenuId((current) => current === column.id ? null : column.id); }}>•••</button>
              </div>
              <button type="button" className="notes-column-resize" aria-label={`Resize ${column.name} column`} onPointerDown={(event) => resizeColumn(column.id, event)} />
              {columnMenuId === column.id && <div className="notes-context-menu notes-column-menu" role="menu" aria-label={`Actions for ${column.name} column`}>
                <button type="button" role="menuitem" onClick={() => { setEditingColumnId(column.id); setColumnMenuId(null); }}>Edit column</button>
                <button type="button" role="menuitem" onClick={() => { setRenamingColumnId(column.id); setColumnMenuId(null); }}>Rename</button>
                <button type="button" role="menuitem" onClick={() => sortByDirection(column.id, "asc")}>Sort ascending</button>
                <button type="button" role="menuitem" onClick={() => sortByDirection(column.id, "desc")}>Sort descending</button>
                <button type="button" role="menuitem" onClick={() => { setShowColumns(true); setColumnMenuId(null); }}>+ Add column</button>
                <button type="button" role="menuitem" className="danger" disabled={collection.columns.length === 1} onClick={() => { removeColumn(column.id); setColumnMenuId(null); }}>Delete column</button>
              </div>}
            </th>
          ))}</tr></thead>
          <tbody>{visibleRows.map(({ row, depth, hasChildren, collapsed }, rowIndex) => <tr
            key={row.id}
            ref={(element) => { if (element) rowRefs.current.set(row.id, element); else rowRefs.current.delete(row.id); }}
            data-row-depth={depth}
            data-row-highlight={row.highlightColor}
          >{collection.columns.map((column, columnIndex) => <td key={column.id} style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : undefined}><div className={columnIndex === 0 ? "notes-tree-cell" : undefined} style={columnIndex === 0 ? { paddingLeft: `${depth * 1.1}rem` } : undefined}>{columnIndex === 0 && (hasChildren ? (
            <button type="button" className="notes-row-toggle" aria-label={`${collapsed ? "Expand" : "Collapse"} row ${rowIndex + 1}`} aria-expanded={!collapsed} onClick={() => toggleRow(row.id)}>{collapsed ? "▸" : "▾"}</button>
          ) : <span className="notes-row-toggle-spacer" />)}{columnIndex === 0 && <div className="notes-inline-row-actions" onPointerDown={(event) => event.stopPropagation()}><button type="button" className="notes-subrow-add" onClick={() => addRow(row.id)} aria-label={`Add subrow to row ${rowIndex + 1}`} title="Add a subrow">+</button><button type="button" className="notes-row-menu-trigger" aria-haspopup="menu" aria-expanded={rowMenu?.id === row.id} aria-label={`Row actions for row ${rowIndex + 1}`} onClick={(event) => openRowMenu(event, row.id)}>•••</button></div>}{column.type === "page" ? (
            collection.pageCells?.[`${row.id}:${column.id}`]
              ? <button type="button" className="notes-page-cell" onClick={() => onOpenPage(row.id, column.id)} aria-label={`Open ${column.name} page for row ${rowIndex + 1}`}>Open {collection.pageCells[`${row.id}:${column.id}`].title}</button>
              : <button type="button" className="notes-page-cell" onClick={() => onCreatePageCell(row.id, column.id)} aria-label={`Create ${column.name} page for row ${rowIndex + 1}`}>+ Page</button>
          ) : column.type === "checkbox" ? (
            <input data-column-id={column.id} type="checkbox" aria-label={`${column.name} for row ${rowIndex + 1}`} checked={row.cells[column.id] === true} onKeyDown={(event) => moveToNextRow(event, rowIndex, column.id)} onChange={(event) => updateCell(row.id, column.id, event.target.checked)} />
          ) : column.type === "select" ? (
            <select data-column-id={column.id} aria-label={`${column.name} for row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onKeyDown={(event) => moveToNextRow(event, rowIndex, column.id)} onChange={(event) => updateCell(row.id, column.id, event.target.value)}><option value="">Select…</option>{column.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          ) : column.type === "relation" ? (
            (() => { const source = pages.find((page) => page.id === column.relationPageId && page.kind === "collection" && !page.archived); const selectedId = String(row.cells[column.id] ?? ""); const selectedIndex = source?.collection?.rows.findIndex((item) => item.id === selectedId) ?? -1; const selected = selectedIndex >= 0 ? source?.collection?.rows[selectedIndex] : undefined; const firstColumn = source?.collection?.columns[0]; const label = selected && firstColumn ? String(selected.cells[firstColumn.id] ?? "") || `Row ${selectedIndex + 1}` : ""; return <button type="button" data-column-id={column.id} className="notes-relation-trigger" aria-label={`${column.name} for row ${rowIndex + 1}`} onKeyDown={(event) => moveToNextRow(event, rowIndex, column.id)} onClick={(event) => source ? openRelationMenu(event, row.id, column.id) : setEditingColumnId(column.id)}>{label || (source ? "Choose record…" : "Choose source table")}</button>; })()
          ) : column.type === "formula" ? (
            <div className="notes-formula-property"><output className="notes-formula-cell" aria-label={`${column.name} for row ${rowIndex + 1}`}>{formulaValue(row, column)}</output>{formulaValue(row, column) === "—" && <button type="button" onClick={() => setEditingColumnId(column.id)}>Configure formula</button>}</div>
          ) : column.type === "currency" || column.type === "percent" ? (
            <label className="notes-number-property"><span aria-hidden="true">{column.type === "currency" ? "$" : "%"}</span><input data-column-id={column.id} type="number" step="0.01" aria-label={`${column.name} for row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onKeyDown={(event) => moveToNextRow(event, rowIndex, column.id)} onChange={(event) => updateCell(row.id, column.id, event.target.value)} /></label>
          ) : (
            <input data-column-id={column.id} type={column.type} aria-label={`${column.name} for row ${rowIndex + 1}`} value={String(row.cells[column.id] ?? "")} onKeyDown={(event) => moveToNextRow(event, rowIndex, column.id)} onChange={(event) => updateCell(row.id, column.id, event.target.value)} />
          )}</div></td>)}</tr>)}</tbody>
        </table>
      </div>
      <button type="button" className="notes-add-row" onClick={() => addRow()}>+ Add row</button>
      {rowMenu && menuRow && createPortal(<div className="notes-context-menu notes-row-menu notes-row-menu-portal" role="menu" aria-label={`Actions for row ${visibleRows.findIndex(({ row }) => row.id === menuRow.id) + 1}`} style={{ top: rowMenu.top, left: rowMenu.left }} onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" role="menuitem" onClick={() => { addRow(menuRow.id); setRowMenu(null); }}>+ Add subrow</button><button type="button" role="menuitem" onClick={() => renameRow(menuRow.id)}>Rename row</button>
        <div className="notes-highlight-options" role="group" aria-label="Row colors">{ROW_HIGHLIGHT_OPTIONS.map((option) => <button type="button" role="menuitem" key={option.value} data-color={option.value} aria-label={`Highlight row ${visibleRows.findIndex(({ row }) => row.id === menuRow.id) + 1} ${option.label}`} onClick={() => updateRowHighlight(menuRow.id, option.value)}><span className="notes-color-swatch" aria-hidden="true" />{option.label}</button>)}{menuRow.highlightColor && <button type="button" role="menuitem" onClick={() => updateRowHighlight(menuRow.id)}>Clear highlight</button>}</div>
        <button type="button" role="menuitem" className="danger" onClick={() => { removeRow(menuRow.id); setRowMenu(null); }}>Delete row</button>
      </div>, document.body)}
      {relationMenu && (() => { const column = collection.columns.find((item) => item.id === relationMenu.columnId); const source = pages.find((page) => page.id === column?.relationPageId && page.kind === "collection" && !page.archived); const firstColumn = source?.collection?.columns[0]; return createPortal(<div className="notes-context-menu notes-relation-menu" role="listbox" aria-label={`Choose ${column?.name ?? "relation"} record`} style={{ top: relationMenu.top, left: relationMenu.left }}><button type="button" role="option" aria-selected={!collection.rows.find((item) => item.id === relationMenu.rowId)?.cells[relationMenu.columnId]} onClick={() => { updateCell(relationMenu.rowId, relationMenu.columnId, ""); setRelationMenu(null); }}>No relation</button>{source?.collection?.rows.map((sourceRow, index) => <button type="button" role="option" aria-selected={collection.rows.find((item) => item.id === relationMenu.rowId)?.cells[relationMenu.columnId] === sourceRow.id} key={sourceRow.id} onClick={() => { updateCell(relationMenu.rowId, relationMenu.columnId, sourceRow.id); setRelationMenu(null); }}>{firstColumn ? String(sourceRow.cells[firstColumn.id] ?? "") || `Row ${index + 1}` : `Row ${index + 1}`}</button>)}</div>, document.body); })()}
    </div>
  );
}

export default function NotesWorkspace({ write, onChange, includeAssistantContext, onAssistantContextChange }: Props) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [menuPageId, setMenuPageId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [iconPickerPageId, setIconPickerPageId] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<NoteTemplate | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [importParentId, setImportParentId] = useState<string | null>(null);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [overlayCell, setOverlayCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const active = write.pages.find((page) => page.id === write.activePageId) ?? write.pages[0];
  const visiblePages = write.pages.filter((page) => page.archived === showArchived && page.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!menuPageId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPageId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuPageId]);

  function commit(pages: NotePage[], activePageId = write.activePageId, allowArchived = false) {
    const nextActive = pages.find((page) => page.id === activePageId && (allowArchived || !page.archived)) ?? pages.find((page) => !page.archived) ?? pages[0];
    onChange({ ...write, pages, activePageId: nextActive?.id ?? "", docHtml: nextActive?.kind === "note" ? nextActive.docHtml : write.docHtml });
  }

  function updateActive(updates: Partial<NotePage>) {
    const updatedAt = now();
    commit(write.pages.map((page) => page.id === active.id ? { ...page, ...updates, updatedAt } : page));
  }

  function createPage(kind: NotePage["kind"], template?: "testing", parentId: string | null = null) {
    const timestamp = now();
    const page: NotePage = {
      id: makeId("note"),
      parentId,
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
    setMenuPageId(null);
  }

  function createFromTemplate(template: NoteTemplate) {
    const timestamp = now();
    const page: NotePage = {
      id: makeId("note"),
      parentId: null,
      title: template.title,
      kind: template.kind,
      docHtml: template.docHtml,
      archived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      collection: cloneCollection(template.collection),
    };
    commit([...write.pages, page], page.id);
    setShowArchived(false);
    setPendingTemplate(null);
  }

  function replaceFromTemplate(template: NoteTemplate) {
    commit(write.pages.map((page) => page.id === active.id ? {
      ...page,
      title: template.title,
      kind: template.kind,
      docHtml: template.docHtml,
      collection: cloneCollection(template.collection),
      updatedAt: now(),
    } : page), active.id);
    setPendingTemplate(null);
  }

  function saveAsTemplate(page: NotePage) {
    const template: NoteTemplate = {
      id: makeId("template"),
      title: page.title || "Untitled template",
      kind: page.kind,
      docHtml: page.docHtml,
      collection: cloneCollection(page.collection),
      createdAt: now(),
    };
    onChange({ ...write, templates: [...(write.templates ?? []), template] });
    setMenuPageId(null);
  }

  function beginRename(page: NotePage) {
    setRenameDraft(page.title);
    setRenamingPageId(page.id);
    setMenuPageId(null);
  }

  function finishRename(pageId: string) {
    const title = renameDraft.trim();
    if (title) commit(write.pages.map((page) => page.id === pageId ? { ...page, title, updatedAt: now() } : page), pageId);
    setRenamingPageId(null);
  }

  function changePageIcon(pageId: string, icon: string) {
    commit(write.pages.map((page) => page.id === pageId ? { ...page, icon, updatedAt: now() } : page));
    setIconPickerPageId(null);
    setMenuPageId(null);
  }

  function openImport(parentId: string) {
    setImportParentId(parentId);
    setMenuPageId(null);
    importRef.current?.click();
  }

  async function importFile(file?: File) {
    if (!file || !importParentId) return;
    const text = await file.text();
    const timestamp = now();
    const title = importedTitle(file.name);
    const csv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
    let page: NotePage;
    if (csv) {
      const records = parseCsv(text);
      const headers = records[0]?.map((header, index) => header.trim() || `Column ${index + 1}`) ?? ["Name"];
      const columns: NoteColumn[] = headers.map((name, index) => ({ id: `import-column-${index}`, name, type: "text" }));
      page = {
        id: makeId("note"), parentId: importParentId, title, kind: "collection", docHtml: "", archived: false, createdAt: timestamp, updatedAt: timestamp,
        collection: { columns, rows: records.slice(1).map((values, rowIndex) => ({ id: `import-row-${rowIndex}`, cells: Object.fromEntries(columns.map((column, index) => [column.id, values[index] ?? ""])) })), view: "all" },
      };
    } else {
      page = { id: makeId("note"), parentId: importParentId, title, kind: "note", docHtml: escapedDocument(text), archived: false, createdAt: timestamp, updatedAt: timestamp };
    }
    commit([...write.pages, page], page.id);
    setImportParentId(null);
    if (importRef.current) importRef.current.value = "";
  }

  function deletePage(pageId: string) {
    const page = write.pages.find((item) => item.id === pageId);
    if (!page || !window.confirm(`Delete “${page.title}” and move it to Archived? You can restore it later.`)) return;
    const subtree = new Set([page.id]);
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

  function togglePage(pageId: string) {
    const collapsed = new Set(write.collapsedPageIds ?? []);
    if (collapsed.has(pageId)) collapsed.delete(pageId);
    else collapsed.add(pageId);
    onChange({ ...write, collapsedPageIds: [...collapsed] });
  }

  function movePage(pageId: string, parentId: string | null) {
    if (pageId === parentId || (parentId && descendantsOf(pageId).has(parentId))) return;
    commit(write.pages.map((page) => page.id === pageId ? { ...page, parentId, updatedAt: now() } : page), write.activePageId);
    setDraggedPageId(null);
    setMenuPageId(null);
  }

  function reorderPage(pageId: string, targetId: string) {
    if (pageId === targetId) return;
    const target = write.pages.find((page) => page.id === targetId);
    if (!target) return;
    const moved = write.pages.find((page) => page.id === pageId);
    if (!moved || descendantsOf(pageId).has(targetId)) return;
    const without = write.pages.filter((page) => page.id !== pageId);
    const targetIndex = without.findIndex((page) => page.id === targetId);
    without.splice(targetIndex + 1, 0, { ...moved, parentId: target.parentId, updatedAt: now() });
    commit(without, write.activePageId, showArchived);
    setDraggedPageId(null);
  }

  function movePageSibling(pageId: string, direction: -1 | 1) {
    const page = write.pages.find((item) => item.id === pageId);
    if (!page) return;
    const siblings = write.pages.filter((item) => item.parentId === page.parentId && item.archived === page.archived);
    const index = siblings.findIndex((item) => item.id === pageId);
    const target = siblings[index + direction];
    if (!target) return;
    const reordered = [...write.pages];
    const from = reordered.findIndex((item) => item.id === pageId);
    const to = reordered.findIndex((item) => item.id === target.id);
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    commit(reordered, write.activePageId, showArchived);
    setMenuPageId(null);
  }

  function restorePage(pageId: string) {
    const restoreIds = new Set([pageId, ...descendantsOf(pageId)]);
    let parentId = write.pages.find((page) => page.id === pageId)?.parentId;
    while (parentId) {
      restoreIds.add(parentId);
      parentId = write.pages.find((page) => page.id === parentId)?.parentId;
    }
    const pages = write.pages.map((page) => restoreIds.has(page.id) ? { ...page, archived: false, updatedAt: now() } : page);
    setShowArchived(false);
    commit(pages, pageId);
  }

  function restoreAllPages() {
    const pages = write.pages.map((page) => page.archived ? { ...page, archived: false, updatedAt: now() } : page);
    setShowArchived(false);
    commit(pages);
  }

  function createPageCell(rowId: string, columnId: string) {
    if (active.kind !== "collection" || !active.collection) return;
    const row = active.collection.rows.find((item) => item.id === rowId);
    const column = active.collection.columns.find((item) => item.id === columnId);
    if (!row || !column) return;
    const firstValue = active.collection.columns.map((item) => row.cells[item.id]).find((value) => typeof value === "string" && value.trim());
    const timestamp = now();
    const key = `${rowId}:${columnId}`;
    const collection = { ...active.collection, pageCells: { ...(active.collection.pageCells ?? {}), [key]: { title: typeof firstValue === "string" ? firstValue : `${column.name} page`, docHtml: "", updatedAt: timestamp } } };
    updateActive({ collection });
    setOverlayCell({ rowId, columnId });
  }

  function updateEmbeddedPage(updates: { title?: string; docHtml?: string }) {
    if (!overlayCell || active.kind !== "collection" || !active.collection) return;
    const key = `${overlayCell.rowId}:${overlayCell.columnId}`;
    const current = active.collection.pageCells?.[key];
    if (!current) return;
    updateActive({ collection: { ...active.collection, pageCells: { ...(active.collection.pageCells ?? {}), [key]: { ...current, ...updates, updatedAt: now() } } } });
  }

  function openPageMenu(event: React.MouseEvent<HTMLButtonElement>, pageId: string) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 480;
    const gap = 6;
    const opensRight = rect.right + gap + menuWidth <= window.innerWidth - 8;
    setMenuPosition({
      top: Math.max(8, Math.min(window.innerHeight - menuHeight - 8, rect.top)),
      left: Math.max(8, opensRight ? rect.right + gap : rect.left - menuWidth - gap),
    });
    setIconPickerPageId(null);
    setMenuPageId((current) => current === pageId ? null : pageId);
  }

  function pageMenu(page: NotePage) {
    return createPortal(<>
      <button type="button" className="notes-menu-backdrop" aria-label="Close page actions" onClick={() => setMenuPageId(null)} />
      <div className="notes-page-menu" role="menu" aria-label={`Actions for ${page.title || "Untitled"}`} style={menuPosition}>
        <button type="button" role="menuitem" onClick={() => createPage("note", undefined, page.id)}><span aria-hidden="true">▤</span>Add page</button>
        <button type="button" role="menuitem" onClick={() => createPage("collection", undefined, page.id)}><span aria-hidden="true">▦</span>Add table</button>
        <button type="button" role="menuitem" onClick={() => openImport(page.id)}><span aria-hidden="true">⇩</span>Import</button>
        <div className="notes-menu-divider" />
        <button type="button" role="menuitem" onClick={() => beginRename(page)}><span aria-hidden="true">✎</span>Rename</button>
        <button type="button" role="menuitem" aria-expanded={iconPickerPageId === page.id} onClick={() => setIconPickerPageId((current) => current === page.id ? null : page.id)}><span aria-hidden="true">{pageIcon(page)}</span>Change icon</button>
        {iconPickerPageId === page.id && <div className="notes-icon-picker" role="group" aria-label={`Choose icon for ${page.title || "Untitled"}`}>{PAGE_ICONS.map((icon) => <button type="button" key={icon} aria-label={`Use ${icon} icon`} onClick={() => changePageIcon(page.id, icon)}>{icon}</button>)}</div>}
        <button type="button" role="menuitem" onClick={() => saveAsTemplate(page)}><span aria-hidden="true">☆</span>Save as template</button>
        <div className="notes-menu-divider" />
        <button type="button" role="menuitem" onClick={() => movePageSibling(page.id, -1)}><span aria-hidden="true">↑</span>Move up</button>
        <button type="button" role="menuitem" onClick={() => movePageSibling(page.id, 1)}><span aria-hidden="true">↓</span>Move down</button>
        {page.parentId && <button type="button" role="menuitem" onClick={() => movePage(page.id, null)}><span aria-hidden="true">↖</span>Move to top level</button>}
        <div className="notes-menu-divider" />
        <button type="button" role="menuitem" className="danger" onClick={() => { setMenuPageId(null); deletePage(page.id); }}><span aria-hidden="true">×</span>Delete</button>
      </div>
    </>, document.body);
  }

  function renderTree(parentId: string | null, depth = 0, visited = new Set<string>()): React.ReactNode {
    return visiblePages.filter((page) => page.parentId === parentId || (depth === 0 && page.parentId && !visiblePages.some((candidate) => candidate.id === page.parentId))).map((page) => {
      const hasChildren = visiblePages.some((candidate) => candidate.parentId === page.id);
      const collapsed = write.collapsedPageIds?.includes(page.id) === true;
      return (
      <div key={page.id}>
        <div className={`notes-tree-row ${draggedPageId === page.id ? "dragging" : ""}`} draggable={!showArchived} onDragStart={() => setDraggedPageId(page.id)} onDragEnd={() => setDraggedPageId(null)} onDragOver={(event) => { if (draggedPageId && draggedPageId !== page.id) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (draggedPageId) reorderPage(draggedPageId, page.id); }} style={{ paddingLeft: `${depth * 0.85}rem` }}>
          {hasChildren ? <button type="button" className="notes-page-toggle" aria-label={`${collapsed ? "Expand" : "Collapse"} page ${page.title || "Untitled"}`} aria-expanded={!collapsed} onClick={() => togglePage(page.id)}>{collapsed ? "▸" : "▾"}</button> : <span className="notes-page-toggle-spacer" />}
          {renamingPageId === page.id ? <input autoFocus className="notes-tree-rename" aria-label={`Rename ${page.title || "Untitled"}`} value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} onBlur={() => finishRename(page.id)} onKeyDown={(event) => { if (event.key === "Enter") finishRename(page.id); if (event.key === "Escape") setRenamingPageId(null); }} /> : <button type="button" className={`notes-tree-item ${page.id === active?.id ? "active" : ""}`} onClick={() => commit(write.pages, page.id, showArchived)}>
            <span aria-hidden="true">{pageIcon(page)}</span><span>{page.title || "Untitled"}</span>
          </button>}
          {!showArchived && <button type="button" className="notes-page-menu-trigger" aria-label={`Page actions for ${page.title || "Untitled"}`} aria-haspopup="menu" aria-expanded={menuPageId === page.id} onClick={(event) => openPageMenu(event, page.id)}>•••</button>}
          {menuPageId === page.id && pageMenu(page)}
        </div>
        {!collapsed && !visited.has(page.id) && renderTree(page.id, depth + 1, new Set([...visited, page.id]))}
      </div>
      );
    });
  }

  if (!active) return <div className="notes-empty">No notes available.</div>;

  return (
    <div className="notes-workspace">
      <aside className="notes-explorer editor-panel">
        <div className="notes-explorer-head"><div><p className="kicker">Knowledge</p><h2>Notes</h2></div><button type="button" onClick={() => createPage("note")} aria-label="New note">+</button></div>
        <input className="notes-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages" aria-label="Search notes" />
        <div className="notes-create-actions">
          <button type="button" onClick={() => createPage("note", undefined, null)}>Note</button>
          <button type="button" onClick={() => createPage("collection", undefined, null)}>Table</button>
          <button type="button" onClick={() => createPage("collection", "testing", null)}>Testing panel</button>
        </div>
        {(write.templates?.length ?? 0) > 0 && <label className="notes-template-create">Templates<select aria-label="Create from template" value="" onChange={(event) => { const template = write.templates?.find((item) => item.id === event.target.value); if (template) setPendingTemplate(template); }}><option value="">Choose…</option>{write.templates?.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></label>}
        <input ref={importRef} className="notes-import-input" type="file" accept=".txt,.md,.markdown,.csv,.json,.html,.htm,text/plain,text/html,text/markdown,text/csv,application/json" onChange={(event) => void importFile(event.target.files?.[0])} />
        <nav className="notes-tree" aria-label={showArchived ? "Archived notes" : "Note pages"}>{renderTree(null)}</nav>
        <div className="notes-archive-actions"><button type="button" className="notes-archive-toggle" onClick={() => setShowArchived((value) => !value)}>{showArchived ? "← Active pages" : `Archived (${write.pages.filter((page) => page.archived).length})`}</button>{showArchived && write.pages.some((page) => page.archived) && <button type="button" onClick={restoreAllPages}>Restore all</button>}</div>
      </aside>

      <section className="notes-main editor-panel">
        <header className="notes-page-head">
          <div className="notes-title-wrap"><span>{active.kind === "collection" ? "Collection" : "Page"}</span><input value={active.title} onChange={(event) => updateActive({ title: event.target.value })} aria-label="Page title" /></div>
          <div className="notes-page-actions">
            {!active.archived && <label>Parent<select value={active.parentId ?? ""} onChange={(event) => updateActive({ parentId: event.target.value || null })} aria-label="Parent page"><option value="">Top level</option>{write.pages.filter((page) => !page.archived && page.id !== active.id && !descendantsOf(active.id).has(page.id)).map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}</select></label>}
            <label className="notes-context-toggle"><input type="checkbox" checked={includeAssistantContext} onChange={(event) => onAssistantContextChange(event.target.checked)} />Use this page with AI</label>
            {active.archived && <button type="button" onClick={() => restorePage(active.id)}>Restore subtree</button>}
          </div>
        </header>
        {active.kind === "note" ? <RichNoteEditor key={active.id} page={active} onChange={(docHtml) => updateActive({ docHtml })} /> : <CollectionEditor collection={active.collection ?? { columns: [], rows: [], view: "all" }} currentPageId={active.id} pages={write.pages} onChange={(collection) => updateActive({ collection })} onCreatePageCell={createPageCell} onOpenPage={(rowId, columnId) => setOverlayCell({ rowId, columnId })} />}
      </section>
      {overlayCell && active.kind === "collection" && (() => { const key = `${overlayCell.rowId}:${overlayCell.columnId}`; const embedded = active.collection?.pageCells?.[key]; if (!embedded) return null; const overlayPage: NotePage = { id: `embedded-${key}`, parentId: null, title: embedded.title, kind: "note", docHtml: embedded.docHtml, archived: false, createdAt: embedded.updatedAt, updatedAt: embedded.updatedAt }; return createPortal(<div className="notes-linked-page-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlayCell(null); }}><section className="notes-linked-page" role="dialog" aria-modal="true" aria-label={`${embedded.title} linked page`}><header><span>▤</span><input aria-label="Linked page title" value={embedded.title} onChange={(event) => updateEmbeddedPage({ title: event.target.value })} /><button type="button" onClick={() => setOverlayCell(null)} aria-label="Minimize linked page">—</button></header><RichNoteEditor key={overlayPage.id} page={overlayPage} onChange={(docHtml) => updateEmbeddedPage({ docHtml })} /></section></div>, document.body); })()}
      {pendingTemplate && createPortal(<div className="notes-dialog-backdrop" role="presentation"><section className="notes-template-dialog" role="dialog" aria-modal="true" aria-labelledby="template-choice-title"><h3 id="template-choice-title">Use “{pendingTemplate.title}” template?</h3><p>Add it as a new top-level page or replace the current page's content.</p><div><button type="button" onClick={() => createFromTemplate(pendingTemplate)}>Add new page</button><button type="button" onClick={() => replaceFromTemplate(pendingTemplate)}>Replace current page</button><button type="button" onClick={() => setPendingTemplate(null)}>Cancel</button></div></section></div>, document.body)}
    </div>
  );
}
