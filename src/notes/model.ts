export type NoteColumnType = "text" | "number" | "date" | "checkbox" | "select" | "url" | "page";

export type NoteColumn = {
  id: string;
  name: string;
  type: NoteColumnType;
  options?: string[];
  width?: number;
};

export type NoteCollectionRow = {
  id: string;
  cells: Record<string, string | boolean>;
  parentRowId?: string;
  highlightColor?: NoteRowHighlight;
};

export type NoteRowHighlight = "cyan" | "green" | "yellow" | "red" | "purple";

export type NoteCollection = {
  columns: NoteColumn[];
  rows: NoteCollectionRow[];
  collapsedRowIds?: string[];
  view: "all" | "open" | "done";
  sortColumnId?: string;
  sortDirection?: "asc" | "desc";
};

export type NotePage = {
  id: string;
  parentId: string | null;
  title: string;
  icon?: string;
  kind: "note" | "collection";
  docHtml: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  collection?: NoteCollection;
};

export type NoteTemplate = {
  id: string;
  title: string;
  kind: "note" | "collection";
  docHtml: string;
  collection?: NoteCollection;
  createdAt: string;
};

export type WriteState = {
  version: 1;
  /** Compatibility mirror for clients that only understand the legacy Write document. */
  docHtml: string;
  pages: NotePage[];
  activePageId: string;
  templates?: NoteTemplate[];
  collapsedPageIds?: string[];
};

const INITIAL_PAGE_ID = "note-inbox";
const INITIAL_TIMESTAMP = "2026-07-22T00:00:00.000Z";

export function createTestingCollection(): NoteCollection {
  return {
    columns: [
      { id: "test", name: "Test variable", type: "text" },
      { id: "completed", name: "Completed", type: "checkbox" },
      { id: "expectation", name: "What to test", type: "text" },
      { id: "command", name: "Command", type: "text" },
    ],
    rows: [
      { id: "test-build", cells: { test: "Frontend types + build", completed: false, expectation: "TypeScript and production bundle", command: "npm run build" } },
      { id: "test-unit", cells: { test: "Unit and component behavior", completed: false, expectation: "Utilities and React interactions", command: "npm test" } },
      { id: "test-api", cells: { test: "Backend routes and errors", completed: false, expectation: "Express APIs through Supertest", command: "npm test" } },
      { id: "test-dev", cells: { test: "Full local product", completed: false, expectation: "Vite and API start together", command: "npm run dev" } },
    ],
    view: "all",
  };
}

export function createInitialWriteState(docHtml = ""): WriteState {
  return {
    version: 1,
    docHtml,
    activePageId: INITIAL_PAGE_ID,
    pages: [{
      id: INITIAL_PAGE_ID,
      parentId: null,
      title: docHtml.trim() ? "Imported writing" : "Untitled note",
      kind: "note",
      docHtml,
      archived: false,
      createdAt: INITIAL_TIMESTAMP,
      updatedAt: INITIAL_TIMESTAMP,
    }],
  };
}

function isNotePage(value: unknown): value is NotePage {
  if (!value || typeof value !== "object") return false;
  const page = value as Partial<NotePage>;
  return typeof page.id === "string"
    && typeof page.title === "string"
    && (page.kind === "note" || page.kind === "collection")
    && typeof page.docHtml === "string";
}

const NOTE_COLUMN_TYPES = new Set<NoteColumnType>(["text", "number", "date", "checkbox", "select", "url", "page"]);
const NOTE_ROW_HIGHLIGHTS = new Set<NoteRowHighlight>(["cyan", "green", "yellow", "red", "purple"]);

function normalizeCollection(raw: unknown): NoteCollection | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<NoteCollection>;
  if (!Array.isArray(value.columns) || !Array.isArray(value.rows)) return undefined;

  const columns = value.columns.flatMap((column) => {
    if (!column || typeof column !== "object") return [];
    const candidate = column as Partial<NoteColumn>;
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || !NOTE_COLUMN_TYPES.has(candidate.type as NoteColumnType)) return [];
    return [{
      id: candidate.id,
      name: candidate.name,
      type: candidate.type as NoteColumnType,
      ...(candidate.type === "select" ? { options: Array.isArray(candidate.options) ? candidate.options.filter((option): option is string => typeof option === "string") : [] } : {}),
      ...(typeof candidate.width === "number" && candidate.width >= 120 && candidate.width <= 720 ? { width: candidate.width } : {}),
    }];
  });

  const columnIds = new Set(columns.map((column) => column.id));
  const rawRows = value.rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const candidate = row as NoteCollection["rows"][number];
    if (typeof candidate.id !== "string" || !candidate.cells || typeof candidate.cells !== "object") return [];
    return [{
      id: candidate.id,
      cells: Object.fromEntries(Object.entries(candidate.cells).filter(([key, cell]) => columnIds.has(key) && (typeof cell === "string" || typeof cell === "boolean"))),
      ...(typeof candidate.parentRowId === "string" ? { parentRowId: candidate.parentRowId } : {}),
      ...(NOTE_ROW_HIGHLIGHTS.has(candidate.highlightColor as NoteRowHighlight) ? { highlightColor: candidate.highlightColor as NoteRowHighlight } : {}),
    }];
  });

  const rowIds = new Set(rawRows.map((row) => row.id));
  const parentByRow = new Map(rawRows.map((row) => [row.id, row.parentRowId]));
  const hasParentCycle = (rowId: string, parentRowId: string) => {
    const visited = new Set([rowId]);
    let current: string | undefined = parentRowId;
    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = parentByRow.get(current);
    }
    return false;
  };
  const rows = rawRows.map((row) => {
    if (!row.parentRowId || !rowIds.has(row.parentRowId) || row.parentRowId === row.id || hasParentCycle(row.id, row.parentRowId)) {
      const { parentRowId: _invalidParent, ...rootRow } = row;
      return rootRow;
    }
    return row;
  });
  const collapsedRowIds = Array.isArray(value.collapsedRowIds)
    ? [...new Set(value.collapsedRowIds.filter((id): id is string => typeof id === "string" && rowIds.has(id)))]
    : [];

  const sortColumnId = typeof value.sortColumnId === "string" && columnIds.has(value.sortColumnId) ? value.sortColumnId : undefined;

  return {
    columns,
    rows,
    ...(collapsedRowIds.length ? { collapsedRowIds } : {}),
    view: value.view === "open" || value.view === "done" ? value.view : "all",
    ...(sortColumnId ? { sortColumnId, sortDirection: value.sortDirection === "desc" ? "desc" as const : "asc" as const } : {}),
  };
}

export function normalizeWriteState(raw: unknown): WriteState {
  if (!raw || typeof raw !== "object") return createInitialWriteState();
  const value = raw as Partial<WriteState>;
  const legacyHtml = typeof value.docHtml === "string" ? value.docHtml : "";
  const pages = Array.isArray(value.pages) ? value.pages.filter(isNotePage).map((page) => ({
    ...page,
    parentId: typeof page.parentId === "string" ? page.parentId : null,
    icon: typeof page.icon === "string" ? page.icon.slice(0, 8) : undefined,
    archived: page.archived === true,
    createdAt: typeof page.createdAt === "string" ? page.createdAt : INITIAL_TIMESTAMP,
    updatedAt: typeof page.updatedAt === "string" ? page.updatedAt : INITIAL_TIMESTAMP,
    collection: page.kind === "collection" ? normalizeCollection(page.collection) ?? { columns: [], rows: [], view: "all" as const } : undefined,
  })) : [];
  const templates = Array.isArray(value.templates) ? value.templates.flatMap((template) => {
    if (!template || typeof template !== "object") return [];
    const candidate = template as Partial<NoteTemplate>;
    if (typeof candidate.id !== "string" || typeof candidate.title !== "string" || (candidate.kind !== "note" && candidate.kind !== "collection")) return [];
    return [{
      id: candidate.id,
      title: candidate.title,
      kind: candidate.kind,
      docHtml: typeof candidate.docHtml === "string" ? candidate.docHtml : "",
      collection: candidate.kind === "collection" ? normalizeCollection(candidate.collection) ?? { columns: [], rows: [], view: "all" as const } : undefined,
      createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : INITIAL_TIMESTAMP,
    }];
  }) : [];

  if (pages.length === 0) return createInitialWriteState(legacyHtml);

  const requestedActive = typeof value.activePageId === "string" ? value.activePageId : "";
  const active = pages.find((page) => page.id === requestedActive && !page.archived)
    ?? pages.find((page) => !page.archived)
    ?? pages[0];

  return {
    version: 1,
    pages,
    activePageId: active.id,
    docHtml: active.kind === "note" ? active.docHtml : legacyHtml,
    ...(templates.length ? { templates } : {}),
    ...(Array.isArray(value.collapsedPageIds) ? { collapsedPageIds: [...new Set(value.collapsedPageIds.filter((id): id is string => typeof id === "string" && pages.some((page) => page.id === id)))] } : {}),
  };
}

export function activeNoteContext(write: WriteState) {
  const page = write.pages.find((item) => item.id === write.activePageId && !item.archived);
  if (!page) return { title: "", kind: "note", document: "" };
  if (page.kind === "collection") {
    return {
      title: page.title,
      kind: page.kind,
      columns: page.collection?.columns.map((column) => column.name) ?? [],
      rows: page.collection?.rows.slice(0, 50).map((row) => ({ id: row.id, parentRowId: row.parentRowId ?? null, cells: row.cells })) ?? [],
    };
  }
  return { title: page.title, kind: page.kind, document: page.docHtml };
}
