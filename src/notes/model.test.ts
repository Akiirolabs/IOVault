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
        ],
        rows: [{ id: "row", cells: { text: "A", number: "2", date: "2026-07-23", check: true, status: "Done", url: "https://example.com" } }],
        view: "done",
        sortColumnId: "number",
        sortDirection: "asc",
      },
    }];
    write.activePageId = "typed-table";

    const normalized = normalizeWriteState(JSON.parse(JSON.stringify(write)));
    expect(normalized.pages[0].collection?.columns.map((column) => column.type)).toEqual(["text", "number", "date", "checkbox", "select", "url"]);
    expect(normalized.pages[0].collection?.columns[4].options).toEqual(["Todo", "Done"]);
    expect(normalized.pages[0].collection?.rows[0].cells.status).toBe("Done");
    expect(normalized.pages[0].collection?.sortColumnId).toBe("number");
  });
});
