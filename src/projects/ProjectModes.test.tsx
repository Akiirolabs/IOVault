import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectFlowchartEditor, ProjectMindmapEditor, ProjectTableEditor } from "./ProjectModes";
import { createProjectFlowchart, createProjectMindmap, createProjectTable, type ProjectFlowchart, type ProjectMindmap, type ProjectTable } from "./model";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("PointerEvent", MouseEvent);
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
});

describe("project workspace modes", () => {
  it("creates typed table columns and cleans deleted rows and columns", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    function Harness() { const [table, setTable] = useState<ProjectTable>(createProjectTable()); return <ProjectTableEditor table={table} onChange={setTable} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Row" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New project column name" }), { target: { value: "Status" } });
    fireEvent.change(screen.getByRole("combobox", { name: "New project column type" }), { target: { value: "select" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Project select options" }), { target: { value: "Todo, Done" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Status row 1" }), { target: { value: "Done" } });
    expect(screen.getByRole("combobox", { name: "Status row 1" })).toHaveValue("Done");
    fireEvent.click(screen.getByRole("button", { name: "Delete Status column" }));
    expect(screen.queryByRole("combobox", { name: "Status row 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete project row 1" }));
    expect(screen.queryByRole("textbox", { name: "Name row 1" })).not.toBeInTheDocument();
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
  });
});
