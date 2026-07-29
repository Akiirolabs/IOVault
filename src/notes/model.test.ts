import { describe, expect, it } from "vitest";
import { activeNoteContext, createInitialWriteState, createTestingCollection, normalizeWriteState } from "./model";

describe("Notes model", () => {
  it("migrates the legacy Write document without changing its HTML", () => {
    const write = normalizeWriteState({ docHtml: "<h2>Existing</h2><p>Keep me</p>" });
    expect(write.version).toBe(1);
    expect(write.pages).toHaveLength(1);
    expect(write.pages[0].docHtml).toBe("<h2>Existing</h2><p>Keep me</p>");
    expect(write.docHtml).toBe("<h2>Existing</h2><p>Keep me</p>");
  });

  it("repairs a missing active page and preserves archived pages", () => {
    const original = createInitialWriteState("<p>One</p>");
    original.pages.push({ ...original.pages[0], id: "archived", title: "Archived", archived: true });
    const write = normalizeWriteState({ ...original, activePageId: "missing" });
    expect(write.activePageId).toBe("note-inbox");
    expect(write.pages.find((page) => page.id === "archived")?.archived).toBe(true);
  });

  it("creates the repository-valid testing panel", () => {
    const collection = createTestingCollection();
    expect(collection.columns.map((column) => column.name)).toEqual(["Test variable", "Completed", "What to test", "Command"]);
    expect(collection.rows.some((row) => row.cells.command === "npm run build")).toBe(true);
    expect(collection.rows.some((row) => row.cells.command === "npx prisma validate")).toBe(false);
  });

  it("returns only the active page as assistant context", () => {
    const write = createInitialWriteState("<p>Visible</p>");
    write.pages.push({ ...write.pages[0], id: "private", title: "Private", docHtml: "<p>Hidden</p>" });
    expect(JSON.stringify(activeNoteContext(write))).toContain("Visible");
    expect(JSON.stringify(activeNoteContext(write))).not.toContain("Hidden");
  });

  it("preserves supported collection types and select options through reload normalization", () => {
    const write = createInitialWriteState();
    write.pages = [{
      ...write.pages[0],
      id: "typed-table",
      kind: "collection",
      title: "Typed table",
      collection: {
        columns: [
          { id: "text", name: "Text", type: "text" },
          { id: "number", name: "Number", type: "number" },
          { id: "date", name: "Date", type: "date" },
          { id: "check", name: "Check", type: "checkbox" },
          { id: "status", name: "Status", type: "select", options: ["Todo", "Done"] },
          { id: "url", name: "URL", type: "url" },
          { id: "currency", name: "Currency", type: "currency" },
          { id: "percent", name: "Percent", type: "percent" },
          { id: "email", name: "Email", type: "email" },
          { id: "formula", name: "Formula", type: "formula", formula: "{Number} * 2" },
          { id: "relation", name: "Relation", type: "relation" },
        ],
        rows: [{ id: "row", cells: { text: "A", number: "2", date: "2026-07-23", check: true, status: "Done", url: "https://example.com" } }],
        view: "done",
        sortColumnId: "number",
        sortDirection: "asc",
      },
    }];
    write.activePageId = "typed-table";

    const normalized = normalizeWriteState(JSON.parse(JSON.stringify(write)));
    expect(normalized.pages[0].collection?.columns.map((column) => column.type)).toEqual(["text", "number", "date", "checkbox", "select", "url", "currency", "percent", "email", "formula", "relation"]);
    expect(normalized.pages[0].collection?.columns[4].options).toEqual(["Todo", "Done"]);
    expect(normalized.pages[0].collection?.rows[0].cells.status).toBe("Done");
    expect(normalized.pages[0].collection?.sortColumnId).toBe("number");
    expect(normalized.pages[0].collection?.columns[9].formula).toBe("{Number} * 2");
  });

  it("preserves supported row highlight colors and removes invalid values", () => {
    const write = createInitialWriteState();
    write.pages[0] = {
      ...write.pages[0],
      kind: "collection",
      collection: {
        columns: [{ id: "name", name: "Name", type: "text" }],
        rows: [
          { id: "green", cells: { name: "Kept" }, highlightColor: "green" },
          { id: "invalid", cells: { name: "Removed" }, highlightColor: "orange" as never },
        ],
        view: "all",
      },
    };
    const normalized = normalizeWriteState(write);
    expect(normalized.pages[0].collection?.rows[0].highlightColor).toBe("green");
    expect(normalized.pages[0].collection?.rows[1].highlightColor).toBeUndefined();
  });

  it("preserves valid nested rows and repairs invalid row hierarchies", () => {
    const write = createInitialWriteState();
    write.pages = [{
      ...write.pages[0],
      id: "nested-table",
      kind: "collection",
      collection: {
        columns: [{ id: "name", name: "Name", type: "text" }],
        rows: [
          { id: "parent", cells: { name: "Parent" } },
          { id: "child", parentRowId: "parent", cells: { name: "Child" } },
          { id: "orphan", parentRowId: "missing", cells: { name: "Orphan" } },
          { id: "cycle-a", parentRowId: "cycle-b", cells: { name: "A" } },
          { id: "cycle-b", parentRowId: "cycle-a", cells: { name: "B" } },
        ],
        collapsedRowIds: ["parent", "missing"],
        view: "all",
      },
    }];
    write.activePageId = "nested-table";

    const normalizedWrite = normalizeWriteState(JSON.parse(JSON.stringify(write)));
    const collection = normalizedWrite.pages[0].collection;
    expect(collection?.rows.find((row) => row.id === "child")?.parentRowId).toBe("parent");
    expect(collection?.rows.find((row) => row.id === "orphan")?.parentRowId).toBeUndefined();
    expect(collection?.rows.find((row) => row.id === "cycle-a")?.parentRowId).toBeUndefined();
    expect(collection?.rows.find((row) => row.id === "cycle-b")?.parentRowId).toBeUndefined();
    expect(collection?.collapsedRowIds).toEqual(["parent"]);
    expect(JSON.stringify(activeNoteContext(normalizedWrite))).toContain('"parentRowId":"parent"');
  });

  it("preserves saved note and collection templates", () => {
    const write = createInitialWriteState();
    write.templates = [
      { id: "note-template", title: "Lesson", kind: "note", docHtml: "<p>Learn</p>", createdAt: "2026-07-24T00:00:00.000Z" },
      { id: "table-template", title: "Tracker", kind: "collection", docHtml: "", createdAt: "2026-07-24T00:00:00.000Z", collection: { columns: [{ id: "name", name: "Name", type: "text" }], rows: [], view: "all" } },
    ];
    const normalized = normalizeWriteState(JSON.parse(JSON.stringify(write)));
    expect(normalized.templates?.map((template) => template.title)).toEqual(["Lesson", "Tracker"]);
    expect(normalized.templates?.[1].collection?.columns[0].name).toBe("Name");
  });

  it("preserves custom page icons", () => {
    const write = createInitialWriteState();
    write.pages[0].icon = "📌";
    expect(normalizeWriteState(JSON.parse(JSON.stringify(write))).pages[0].icon).toBe("📌");
  });

  it("preserves Page columns and collapsed page sections", () => {
    const write = createInitialWriteState();
    write.pages[0] = { ...write.pages[0], kind: "collection", collection: { columns: [{ id: "page", name: "Page", type: "page" }], rows: [{ id: "row", cells: {} }], pageCells: { "row:page": { title: "Embedded", docHtml: "<p>Saved</p>", updatedAt: "2026-07-29T00:00:00.000Z" } }, view: "all" } };
    write.collapsedPageIds = [write.pages[0].id, "missing"];
    const normalized = normalizeWriteState(JSON.parse(JSON.stringify(write)));
    expect(normalized.pages[0].collection?.columns[0].type).toBe("page");
    expect(normalized.pages[0].collection?.pageCells?.["row:page"].docHtml).toBe("<p>Saved</p>");
    expect(normalized.collapsedPageIds).toEqual([write.pages[0].id]);
  });
});
