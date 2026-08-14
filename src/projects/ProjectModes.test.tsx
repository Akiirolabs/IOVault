import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectFlowchartEditor, ProjectMindmapEditor, ProjectTableEditor } from "./ProjectModes";
import { createProjectFlowchart, createProjectMindmap, createProjectTable, type ProjectFlowchart, type ProjectMindmap, type ProjectTable } from "./model";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("PointerEvent", MouseEvent);
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
});
afterEach(cleanup);

describe("project workspace modes", () => {
  it("creates typed table columns and cleans deleted rows and columns", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    function Harness() { const [table, setTable] = useState<ProjectTable>(createProjectTable()); return <ProjectTableEditor table={table} onChange={setTable} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ New row" }));
    expect(screen.queryByRole("textbox", { name: "New project column name" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Property" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New project column name" }), { target: { value: "Status" } });
    fireEvent.change(screen.getByRole("combobox", { name: "New project column type" }), { target: { value: "select" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Project select options" }), { target: { value: "Todo, Done" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Status row 1" }), { target: { value: "Done" } });
    expect(screen.getByRole("combobox", { name: "Status row 1" })).toHaveValue("Done");
    fireEvent.click(screen.getByRole("button", { name: "Status property menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete property" }));
    expect(screen.queryByRole("combobox", { name: "Status row 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Project row 1 menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete row" }));
    expect(screen.queryByRole("textbox", { name: "Name row 1" })).not.toBeInTheDocument();
  });

  it("changes property types safely and keeps row actions in menus", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    function Harness() { const [table, setTable] = useState<ProjectTable>({ columns: [{ id: "value", name: "Value", type: "text" }], rows: [{ id: "row", cells: { value: "not-a-number" } }] }); return <ProjectTableEditor table={table} onChange={setTable} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Value property menu" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "number" }));
    expect(screen.getByRole("spinbutton", { name: "Value row 1" })).toHaveValue(null);
    fireEvent.click(screen.getByRole("button", { name: "Project row 1 menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate row" }));
    expect(screen.getByText(/2 rows/)).toBeInTheDocument();
  });

  it("portals table menus and atomically clears removed select values", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    function Harness() { const [table, setTable] = useState<ProjectTable>({ columns: [{ id: "status", name: "Status", type: "select", options: ["Todo", "Done"] }], rows: [{ id: "row", cells: { status: "Done" } }] }); return <ProjectTableEditor table={table} onChange={setTable} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Status property menu" }));
    expect(screen.getByRole("menu", { name: "Status property options" }).parentElement).toBe(document.body);
    fireEvent.change(screen.getByRole("textbox", { name: "Status select options" }), { target: { value: "Todo" } });
    fireEvent.click(screen.getByRole("menuitem", { name: "Save options" }));
    expect(window.confirm).toHaveBeenCalledWith("Remove these options? Values using removed options will be cleared.");
    expect(screen.getByRole("combobox", { name: "Status row 1" })).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Project row 1 menu" }));
    expect(screen.getByRole("menu", { name: "Project row 1 options" }).parentElement).toBe(document.body);
  });

  it("creates, connects, moves, and safely deletes flowchart nodes", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    function Harness() { const [flowchart, setFlowchart] = useState<ProjectFlowchart>(createProjectFlowchart()); return <ProjectFlowchartEditor flowchart={flowchart} onChange={setFlowchart} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Node" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Node" }));
    fireEvent.click(screen.getByLabelText("Options for Node 1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Connect Node 1" }));
    fireEvent.click(screen.getByLabelText("Options for Node 2"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Connect Node 2" }));
    expect(screen.getByRole("button", { name: "Delete connection Node 1 to Node 2" })).toBeInTheDocument();
    const firstNode = screen.getByRole("textbox", { name: "Node 1 label" }).closest("article")!;
    const moveNode = screen.getByRole("button", { name: "Move Node 1" });
    fireEvent.pointerDown(moveNode, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(moveNode, { pointerId: 1, clientX: 220, clientY: 190 });
    fireEvent.pointerUp(moveNode, { pointerId: 1, clientX: 220, clientY: 190 });
    expect(firstNode).toHaveStyle({ left: "160px", top: "140px" });
    const resize = screen.getByRole("button", { name: "Resize Node 1" });
    fireEvent.pointerDown(resize, { pointerId: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(resize, { pointerId: 2, clientX: 180, clientY: 150 });
    fireEvent.pointerUp(resize, { pointerId: 2, clientX: 180, clientY: 150 });
    expect(firstNode).toHaveStyle({ width: "384px", height: "162px" });
    fireEvent.click(screen.getByLabelText("Options for Node 1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete Node 1" }));
    expect(screen.queryByRole("button", { name: "Delete connection Node 1 to Node 2" })).not.toBeInTheDocument();
  });

  it("persists one flowchart node description across its compact and full-page editors", () => {
    function Harness() { const [flowchart, setFlowchart] = useState<ProjectFlowchart>(createProjectFlowchart()); return <ProjectFlowchartEditor flowchart={flowchart} onChange={setFlowchart} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Node" }));
    fireEvent.click(screen.getByLabelText("Options for Node 1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Description" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Node 1 description" }), { target: { value: "Shared node context" } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByLabelText("Options for Node 1"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Open page" }));
    expect(screen.getByRole("textbox", { name: "Node 1 page content" })).toHaveValue("Shared node context");
  });

  it("portals flowchart options above mutually exclusive node surfaces", () => {
    function Harness() { const [flowchart, setFlowchart] = useState<ProjectFlowchart>(createProjectFlowchart()); return <ProjectFlowchartEditor flowchart={flowchart} onChange={setFlowchart} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Node" }));
    const trigger = screen.getByLabelText("Options for Node 1");
    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "Node 1 options" }).parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole("menuitem", { name: "Description" }));
    expect(screen.queryByRole("menu", { name: "Node 1 options" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Node 1 description" })).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole("textbox", { name: "Node 1 description" })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Node 1 options" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("anchors duplicate flowchart labels to the clicked trigger and supports menu navigation", () => {
    function Harness() { const [flowchart, setFlowchart] = useState<ProjectFlowchart>({ ...createProjectFlowchart(), nodes: [
      { id: "first", label: "Same", x: 0, y: 0, width: 304, height: 112, color: "#38bdf8" },
      { id: "second", label: "Same", x: 350, y: 0, width: 304, height: 112, color: "#38bdf8" },
    ] }); return <ProjectFlowchartEditor flowchart={flowchart} onChange={setFlowchart} />; }
    render(<Harness />);
    const triggers = screen.getAllByLabelText("Options for Same");
    Object.defineProperty(triggers[1], "getBoundingClientRect", { value: () => ({ left: 420, right: 440, top: 740, bottom: 760, width: 20, height: 20, x: 420, y: 740, toJSON: () => ({}) }) });
    fireEvent.click(triggers[1]);
    const menu = screen.getByRole("menu", { name: "Same options" });
    expect(menu).toHaveStyle({ left: "420px" });
    expect(menu).toHaveStyle({ top: "554px" });
    fireEvent.keyDown(document, { key: "End" });
    expect(screen.getByRole("menuitem", { name: "Delete Same" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Home" });
    expect(screen.getByRole("menuitem", { name: "Description" })).toHaveFocus();
  });

  it("builds an object mindmap with fields, relations, hierarchy, and cycle prevention", () => {
    function Harness() { const [mindmap, setMindmap] = useState<ProjectMindmap>(createProjectMindmap()); return <ProjectMindmapEditor mindmap={mindmap} onChange={setMindmap} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Idea" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Idea" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Idea 1 title" }), { target: { value: "Root" } });
    fireEvent.click(screen.getByLabelText("Options for Root"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Connect Root" }));
    fireEvent.click(screen.getByLabelText("Options for Idea 2"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Connect Idea 2" }));
    expect(screen.getByLabelText("Relation arrow Root to Idea 2")).toBeInTheDocument();
    const rootNode = screen.getByRole("textbox", { name: "Root title" }).closest("article")!;
    const moveRoot = screen.getByRole("button", { name: "Move Root" });
    fireEvent.pointerDown(moveRoot, { pointerId: 3, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(moveRoot, { pointerId: 3, clientX: 250, clientY: 210 });
    fireEvent.pointerUp(moveRoot, { pointerId: 3, clientX: 250, clientY: 210 });
    expect(rootNode).toHaveStyle({ left: "210px", top: "170px" });
    expect(screen.queryByRole("button", { name: "+ Field" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Root page" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Root page content" }), { target: { value: "Detailed idea notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Back to mindmap" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Root page" }));
    expect(screen.getByRole("textbox", { name: "Root page content" })).toHaveValue("Detailed idea notes");
    fireEvent.click(screen.getByRole("button", { name: "Back to mindmap" }));
    fireEvent.click(screen.getByLabelText("Options for Root"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Description" }));
    expect(screen.getByRole("textbox", { name: "Root description" })).toHaveValue("Detailed idea notes");
  });

  it("portals mindmap options and dismisses competing surfaces", () => {
    function Harness() { const [mindmap, setMindmap] = useState<ProjectMindmap>(createProjectMindmap()); return <ProjectMindmapEditor mindmap={mindmap} onChange={setMindmap} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Idea" }));
    const trigger = screen.getByLabelText("Options for Idea 1");
    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "Idea 1 options" }).parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole("menuitem", { name: "Description" }));
    expect(screen.queryByRole("menu", { name: "Idea 1 options" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Idea 1 description" })).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole("textbox", { name: "Idea 1 description" })).not.toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu", { name: "Idea 1 options" })).not.toBeInTheDocument();
  });
});
