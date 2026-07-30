import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectFlowchartEditor, ProjectMindmapEditor, ProjectTableEditor } from "./ProjectModes";
import { createProjectFlowchart, createProjectMindmap, createProjectTable, type ProjectFlowchart, type ProjectMindmap, type ProjectTable } from "./model";

beforeEach(() => vi.restoreAllMocks());

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
    fireEvent.click(screen.getByRole("button", { name: "Connect Node 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect Node 2" }));
    expect(screen.getByRole("button", { name: "Delete connection Node 1 to Node 2" })).toBeInTheDocument();
    fireEvent.dragEnd(screen.getByRole("textbox", { name: "Node 1 label" }).closest("article")!, { clientX: 300, clientY: 220 });
    fireEvent.click(screen.getByRole("button", { name: "Delete Node 1" }));
    expect(screen.queryByRole("button", { name: "Delete connection Node 1 to Node 2" })).not.toBeInTheDocument();
  });

  it("builds an object mindmap with fields, relations, hierarchy, and cycle prevention", () => {
    function Harness() { const [mindmap, setMindmap] = useState<ProjectMindmap>(createProjectMindmap()); return <ProjectMindmapEditor mindmap={mindmap} onChange={setMindmap} />; }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "+ Idea" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Idea" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Idea 1 title" }), { target: { value: "Root" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect Root" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect Idea 2" }));
    expect(screen.getByLabelText("Relation arrow Root to Idea 2")).toBeInTheDocument();
    fireEvent.dragEnd(screen.getByRole("textbox", { name: "Root title" }).closest("article")!, { clientX: 360, clientY: 240 });
    expect(screen.queryByRole("button", { name: "+ Field" })).not.toBeInTheDocument();
  });
});
