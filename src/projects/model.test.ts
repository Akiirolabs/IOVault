import { describe, expect, it } from "vitest";
import { filterProjects, normalizeProjectBlock, reorderProjects, type ProjectBlock } from "./model";

describe("project model", () => {
  it("preserves valid mode data and normalizes legacy projects", () => {
    const project = normalizeProjectBlock({ id: "one", title: "Project", status: "In progress", body: "Notes", table: { columns: [{ id: "name", name: "Name", type: "text" }], rows: [{ id: "row", cells: { name: "A" } }] }, flowchart: { nodes: [{ id: "a", label: "A", x: 10, y: 20, color: "#38bdf8" }], edges: [], zoom: 1 }, mindmap: { objects: [{ id: "root", title: "Root", pageText: "Page", relationIds: [], fields: [] }] } });
    expect(project?.table?.rows[0].cells.name).toBe("A");
    expect(project?.flowchart?.nodes[0].x).toBe(10);
    expect(project?.flowchart?.nodes[0].width).toBe(304);
    expect(project?.mindmap?.objects[0].title).toBe("Root");
    expect(project?.mindmap?.objects[0].x).toBe(60);
    expect(project?.mindmap?.objects[0].height).toBe(112);
    expect(project?.mindmap?.objects[0].pageText).toBe("Page");
    expect(normalizeProjectBlock({ id: "legacy", title: "Legacy", body: "" })?.status).toBe("Active");
  });

  it("rejects invalid records and unsupported column types", () => {
    expect(normalizeProjectBlock(null)).toBeNull();
    const project = normalizeProjectBlock({ id: "one", title: "Project", table: { columns: [{ id: "bad", name: "Bad", type: "formula" }], rows: [] } });
    expect(project?.table?.columns).toEqual([]);
  });

  it("filters project statuses and reorders projects without losing records", () => {
    const blocks = [
      { id: "a", title: "Active", status: "Active", body: "" },
      { id: "b", title: "Progress", status: "In progress", body: "" },
      { id: "c", title: "Done", status: "Done", body: "" },
    ] satisfies ProjectBlock[];
    expect(filterProjects(blocks, "active").map((block) => block.id)).toEqual(["a"]);
    expect(filterProjects(blocks, "progress").map((block) => block.id)).toEqual(["b"]);
    expect(filterProjects(blocks, "done").map((block) => block.id)).toEqual(["c"]);
    expect(reorderProjects(blocks, "a", "c").map((block) => block.id)).toEqual(["b", "c", "a"]);
    expect(reorderProjects(blocks, "c", "a", "before").map((block) => block.id)).toEqual(["c", "a", "b"]);
  });
});
