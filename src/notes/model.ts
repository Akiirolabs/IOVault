export type NoteColumnType = "text" | "number" | "date" | "checkbox" | "select" | "url";

export type NoteColumn = {
  id: string;
  name: string;
  type: NoteColumnType;
  options?: string[];
};

export type NoteCollection = {
  columns: NoteColumn[];
  rows: Array<{ id: string; cells: Record<string, string | boolean> }>;
  view: "all" | "open" | "done";
  sortColumnId?: string;
  sortDirection?: "asc" | "desc";
};

export type NotePage = {
  id: string;
  parentId: string | null;
  title: string;
  kind: "note" | "collection";
  docHtml: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  collection?: NoteCollection;
};

export type WriteState = {
  version: 1;
  /** Compatibility mirror for clients that only understand the legacy Write document. */
  docHtml: string;
  pages: NotePage[];
  activePageId: string;
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

const NOTE_COLUMN_TYPES = new Set<NoteColumnType>(["text", "number", "date", "checkbox", "select", "url"]);

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
    }];
  });

  const columnIds = new Set(columns.map((column) => column.id));
  const rows = value.rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const candidate = row as NoteCollection["rows"][number];
    if (typeof candidate.id !== "string" || !candidate.cells || typeof candidate.cells !== "object") return [];
    return [{
      id: candidate.id,
      cells: Object.fromEntries(Object.entries(candidate.cells).filter(([key, cell]) => columnIds.has(key) && (typeof cell === "string" || typeof cell === "boolean"))),
    }];
  });

  const sortColumnId = typeof value.sortColumnId === "string" && columnIds.has(value.sortColumnId) ? value.sortColumnId : undefined;

  return {
    columns,
    rows,
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
    archived: page.archived === true,
    createdAt: typeof page.createdAt === "string" ? page.createdAt : INITIAL_TIMESTAMP,
    updatedAt: typeof page.updatedAt === "string" ? page.updatedAt : INITIAL_TIMESTAMP,
    collection: page.kind === "collection" ? normalizeCollection(page.collection) ?? { columns: [], rows: [], view: "all" as const } : undefined,
  })) : [];

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
      rows: page.collection?.rows.slice(0, 50).map((row) => row.cells) ?? [],
    };
  }
  return { title: page.title, kind: page.kind, document: page.docHtml };
}
