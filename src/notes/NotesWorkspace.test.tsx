import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotesWorkspace from "./NotesWorkspace";
import { createInitialWriteState, type WriteState } from "./model";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Harness() {
  const [write, setWrite] = useState<WriteState>(() => createInitialWriteState("<p>Existing writing</p>"));
  const [includeContext, setIncludeContext] = useState(false);
  return <NotesWorkspace write={write} onChange={setWrite} includeAssistantContext={includeContext} onAssistantContextChange={setIncludeContext} />;
}

describe("Notes workspace", () => {
  it("preserves writing and creates a repository-valid testing collection", () => {
    render(<Harness />);
    expect(screen.getByRole("textbox", { name: "Imported writing content" })).toHaveTextContent("Existing writing");
    fireEvent.click(screen.getByRole("button", { name: "Testing panel" }));
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Testing Panel");
    expect(screen.getByRole("button", { name: "Command" })).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("npm test")).toHaveLength(2);
    expect(screen.queryByDisplayValue("npx prisma validate")).not.toBeInTheDocument();
  });

  it("renames pages and makes assistant context an explicit choice", () => {
    render(<Harness />);
    fireEvent.change(screen.getByRole("textbox", { name: "Page title" }), { target: { value: "Design brief" } });
    expect(screen.getByRole("button", { name: "Design brief" })).toBeInTheDocument();
    const context = screen.getByRole("checkbox", { name: "Use this page with AI" });
    expect(context).not.toBeChecked();
    fireEvent.click(context);
    expect(context).toBeChecked();
  });

  it("deletes notes and tables into the recoverable archive", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled collection" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Archived (1)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archived (1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Untitled collection" }));
    expect(screen.getByRole("button", { name: "Restore subtree" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore subtree" }));
    expect(screen.getByRole("button", { name: "Page actions for Untitled collection" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Note" }));
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled note" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Archived (1)" })).toBeInTheDocument();
  });

  it("creates top-level pages from the toolbar and children from the page menu", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Note" }));
    expect(screen.getByRole("combobox", { name: "Parent page" })).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled note" }));
    expect(screen.getByRole("menuitem", { name: "Add page" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add table" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Import" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Change icon" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Save as template" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled note" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    const rename = screen.getByRole("textbox", { name: "Rename Untitled note" });
    fireEvent.change(rename, { target: { value: "Parent page" } });
    fireEvent.keyDown(rename, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Page actions for Parent page" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Add page" }));
    expect((screen.getByRole("combobox", { name: "Parent page" }) as HTMLSelectElement).value).not.toBe("");
    expect(screen.getByRole("combobox", { name: "Parent page" })).toHaveTextContent("Parent page");

    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("combobox", { name: "Parent page" })).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled collection" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Save as template" }));
    const templates = screen.getByRole("combobox", { name: "Create from template" });
    expect(templates).toHaveTextContent("Untitled collection");
    const templateValue = (templates.querySelector("option:not([value=''])") as HTMLOptionElement).value;
    fireEvent.change(templates, { target: { value: templateValue } });
    expect(screen.getByRole("dialog", { name: "Use “Untitled collection” template?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add new page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replace current page" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  });

  it("opens page actions without leaving the active page and changes the page icon", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Note" }));
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Untitled note");

    fireEvent.click(screen.getByRole("button", { name: "Page actions for Imported writing" }));
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Untitled note");
    fireEvent.click(screen.getByRole("menuitem", { name: "Change icon" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 📌 icon" }));
    expect(screen.getByRole("button", { name: "Imported writing" })).toHaveTextContent("📌");
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Untitled note");
  });

  it("lets template users add a page or replace the current page", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Imported writing" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Save as template" }));
    fireEvent.click(screen.getByRole("button", { name: "Note" }));

    const templates = screen.getByRole("combobox", { name: "Create from template" });
    const templateValue = (templates.querySelector("option:not([value=''])") as HTMLOptionElement).value;
    fireEvent.change(templates, { target: { value: templateValue } });
    fireEvent.click(screen.getByRole("button", { name: "Replace current page" }));
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Imported writing");

    fireEvent.change(templates, { target: { value: templateValue } });
    fireEvent.click(screen.getByRole("button", { name: "Add new page" }));
    expect(screen.getAllByRole("button", { name: "Imported writing" })).toHaveLength(3);
  });

  it("imports text as a child page from the parent menu", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Imported writing" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Import" }));
    const file = new File(["Imported content"], "lesson.md", { type: "text/markdown" });
    Object.defineProperty(file, "text", { value: async () => "Imported content" });
    const input = document.querySelector(".notes-import-input") as HTMLInputElement;
    expect(input.accept).toContain(".md");
    expect(input.accept).toContain(".csv");
    expect(input.accept).toContain(".json");
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("lesson"));
    expect((screen.getByRole("combobox", { name: "Parent page" }) as HTMLSelectElement).value).not.toBe("");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "lesson content" })).toHaveTextContent("Imported content"));
  });

  it("creates and edits every supported column type without browser dialogs", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Column" }));

    const addColumn = (name: string, type: string, options?: string) => {
      fireEvent.change(screen.getByRole("textbox", { name: "New column name" }), { target: { value: name } });
      fireEvent.change(screen.getByRole("combobox", { name: "New column type" }), { target: { value: type } });
      if (options) fireEvent.change(screen.getByRole("textbox", { name: "New column options" }), { target: { value: options } });
      fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    };

    addColumn("Estimate", "number");
    addColumn("Due", "date");
    addColumn("Complete", "checkbox");
    addColumn("Status", "select", "Todo, Doing, Done");
    addColumn("Reference", "url");
    addColumn("Details", "page");

    expect(screen.getByRole("spinbutton", { name: "Estimate for row 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Due for row 1")).toHaveAttribute("type", "date");
    expect(screen.getByRole("checkbox", { name: "Complete for row 1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status for row 1" })).toHaveTextContent("Doing");
    expect(screen.getByRole("textbox", { name: "Reference for row 1" })).toHaveAttribute("type", "url");
    expect(screen.getByRole("button", { name: "Create Details page for row 1" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Name for row 1" }), { target: { value: "Typed row" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Estimate for row 1" }), { target: { value: "12.5" } });
    fireEvent.change(screen.getByLabelText("Due for row 1"), { target: { value: "2026-07-23" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Complete for row 1" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Status for row 1" }), { target: { value: "Done" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Reference for row 1" }), { target: { value: "https://example.com" } });
    expect(screen.getByRole("textbox", { name: "Name for row 1" })).toHaveValue("Typed row");
    expect(screen.getByRole("spinbutton", { name: "Estimate for row 1" })).toHaveValue(12.5);
    expect(screen.getByLabelText("Due for row 1")).toHaveValue("2026-07-23");
    expect(screen.getByRole("checkbox", { name: "Complete for row 1" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Status for row 1" })).toHaveValue("Done");
    expect(screen.getByRole("textbox", { name: "Reference for row 1" })).toHaveValue("https://example.com");

    fireEvent.change(screen.getByRole("combobox", { name: "Type for Name column" }), { target: { value: "number" } });
    expect(screen.getByRole("spinbutton", { name: "Name for row 1" })).toBeInTheDocument();
  });

  it("collapses page sections and keeps inline section renaming", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Note" }));
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled note" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    const rename = screen.getByRole("textbox", { name: "Rename Untitled note" });
    fireEvent.change(rename, { target: { value: "Parent section" } });
    fireEvent.keyDown(rename, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Parent section" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Add page" }));

    fireEvent.click(screen.getByRole("button", { name: "Collapse page Parent section" }));
    expect(screen.queryByRole("button", { name: "Untitled note" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand page Parent section" }));
    expect(screen.getByRole("button", { name: "Untitled note" })).toBeInTheDocument();
  });

  it("provides the expanded note formatting toolbar", () => {
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    render(<Harness />);
    for (const name of ["Text", "H1", "H2", "Bold", "Italic", "Underline", "Strikethrough", "Bullets", "Numbered", "Quote", "Code", "Undo", "Redo", "Clear"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(execCommand).toHaveBeenCalledWith("bold", false, undefined);
  });

  it("creates and opens a full page from a Page column cell", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name for row 1" }), { target: { value: "Task details" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Column" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New column name" }), { target: { value: "Page" } });
    fireEvent.change(screen.getByRole("combobox", { name: "New column type" }), { target: { value: "page" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Page page for row 1" }));
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Task details");
    fireEvent.click(screen.getByRole("button", { name: "Untitled collection" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Page page for row 1" }));
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Task details");
  });

  it("drags a page into another section and offers keyboard move actions", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Note" }));
    const dragged = screen.getByRole("button", { name: "Untitled note" }).closest(".notes-tree-row") as HTMLElement;
    const target = screen.getByRole("button", { name: "Imported writing" }).closest(".notes-tree-row") as HTMLElement;
    expect(dragged).toHaveAttribute("draggable", "true");
    fireEvent.dragStart(dragged);
    fireEvent.dragOver(target);
    fireEvent.drop(target);
    expect(screen.getByRole("combobox", { name: "Parent page" })).not.toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Untitled note" }));
    expect(screen.getByRole("menuitem", { name: "Move up" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Move down" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Move to top level" }));
    expect(screen.getByRole("combobox", { name: "Parent page" })).toHaveValue("");
  });

  it("restores an archived parent with all descendants", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Imported writing" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Add page" }));
    fireEvent.click(screen.getByRole("button", { name: "Page actions for Imported writing" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Archived (2)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archived (2)" }));
    fireEvent.click(screen.getByRole("button", { name: "Imported writing" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore subtree" }));
    expect(screen.getByRole("button", { name: "Archived (0)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Untitled note" })).toBeInTheDocument();
  });

  it("sorts number columns numerically", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Column" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New column name" }), { target: { value: "Estimate" } });
    fireEvent.change(screen.getByRole("combobox", { name: "New column type" }), { target: { value: "number" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Estimate for row 1" }), { target: { value: "10" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Estimate for row 2" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Estimate" }));
    expect(screen.getAllByRole("spinbutton").map((input) => (input as HTMLInputElement).value)).toEqual(["2", "10"]);
  });

  it("adds nested rows and expands or collapses their children", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name for row 1" }), { target: { value: "Parent" } });
    const addSubrow = screen.getByRole("button", { name: "Add subrow to row 1" });
    expect(addSubrow).toHaveTextContent("+");
    expect(addSubrow.closest("td")).toContainElement(screen.getByRole("textbox", { name: "Name for row 1" }));
    expect(screen.getByRole("button", { name: "Delete row 1" })).toHaveTextContent("×");
    fireEvent.click(addSubrow);
    fireEvent.change(screen.getByRole("textbox", { name: "Name for row 2" }), { target: { value: "Child" } });

    expect(screen.getByRole("textbox", { name: "Name for row 2" })).toHaveValue("Child");
    fireEvent.click(screen.getByRole("button", { name: "Collapse row 1" }));
    expect(screen.queryByDisplayValue("Child")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand row 1" }));
    expect(screen.getByDisplayValue("Child")).toBeInTheDocument();
  });
});
