export type NoteColumnType = "text" | "checkbox";

export type NoteColumn = {
  id: string;
  name: string;
  type: NoteColumnType;
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

