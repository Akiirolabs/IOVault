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
      if (options) for (const option of options.split(", ")) {
        const input = screen.getByRole("textbox", { name: "New column option" });
        fireEvent.change(input, { target: { value: option } });
        fireEvent.keyDown(input, { key: "Enter" });
      }
      fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    };

    addColumn("Estimate", "number");
    addColumn("Budget", "currency");
    addColumn("Progress", "percent");
    addColumn("Due", "date");
    addColumn("Complete", "checkbox");
    addColumn("Status", "select", "Todo, Doing, Done");
    addColumn("Reference", "url");
    addColumn("Owner email", "email");
    addColumn("Details", "page");
    addColumn("Total", "formula");
    addColumn("Related", "relation");

    expect(screen.getByRole("spinbutton", { name: "Estimate for row 1" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Budget for row 1" })).toHaveAttribute("step", "0.01");
    expect(screen.getByRole("spinbutton", { name: "Progress for row 1" })).toHaveAttribute("step", "0.01");
    expect(screen.getByLabelText("Due for row 1")).toHaveAttribute("type", "date");
    expect(screen.getByRole("checkbox", { name: "Complete for row 1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status for row 1" })).toHaveTextContent("Doing");
    expect(screen.getByRole("textbox", { name: "Reference for row 1" })).toHaveAttribute("type", "url");
    expect(screen.getByRole("textbox", { name: "Owner email for row 1" })).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: "Create Details page for row 1" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Total for row 1" })).toHaveTextContent("—");
    expect(screen.getByRole("combobox", { name: "Related for row 1" })).toHaveTextContent("Imported writing");

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

    fireEvent.click(screen.getByRole("button", { name: "Column actions for Total" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit column" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Formula for Total" }), { target: { value: "{Estimate} * 2" } });
    expect(screen.getByRole("status", { name: "Total for row 1" })).toHaveTextContent("25");

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

  it("opens formatting from the plus menu and reveals the toolbar only over its control area", () => {
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    render(<Harness />);

    expect(screen.queryByRole("toolbar", { name: "Note formatting" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open insert and formatting menu" }));
    expect(screen.getByRole("menu", { name: "Insert and formatting" })).toBeInTheDocument();
    for (const name of ["Text", "H1", "H2", "Bold", "Italic", "Underline", "Strikethrough", "Bullets", "Numbered", "Quote", "Code", "Undo", "Redo", "Clear"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("menuitem", { name: "Bold" }));
    expect(execCommand).toHaveBeenCalledWith("bold", false, undefined);
    expect(screen.queryByRole("menu", { name: "Insert and formatting" })).not.toBeInTheDocument();

    const editor = screen.getByRole("textbox", { name: "Imported writing content" });
    const shell = editor.closest(".notes-rich-editor-shell");
    const controls = editor.parentElement?.querySelector(".notes-editor-controls");
    expect(shell).not.toBeNull();
    expect(controls).not.toBeNull();
    fireEvent.mouseEnter(shell!);
    expect(screen.queryByRole("toolbar", { name: "Note formatting" })).not.toBeInTheDocument();
    fireEvent.mouseEnter(controls!);
    const toolbar = screen.getByRole("toolbar", { name: "Note formatting" });
    expect(toolbar).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    fireEvent.mouseLeave(controls!);
    expect(screen.queryByRole("toolbar", { name: "Note formatting" })).not.toBeInTheDocument();

    fireEvent.focus(editor);
    expect(screen.queryByRole("toolbar", { name: "Note formatting" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("dialog", { name: "Task details linked page" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Linked page title" })).toHaveValue("Task details");
    expect(screen.queryByRole("button", { name: "Task details" })).not.toBeInTheDocument();
    const embeddedEditor = screen.getByRole("textbox", { name: "Task details content" });
    embeddedEditor.innerHTML = "<p>Saved in the cell</p>";
    fireEvent.input(embeddedEditor);
    fireEvent.mouseDown(document.querySelector(".notes-linked-page-backdrop")!);
    expect(screen.getByRole("textbox", { name: "Page title" })).toHaveValue("Untitled collection");
    expect(screen.queryByRole("dialog", { name: "Task details linked page" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Page page for row 1" }));
    expect(screen.getByRole("dialog", { name: "Task details linked page" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Linked page title" })).toHaveValue("Task details");
    expect(screen.getByRole("textbox", { name: "Task details content" })).toHaveTextContent("Saved in the cell");
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
    fireEvent.click(addSubrow);
    fireEvent.change(screen.getByRole("textbox", { name: "Name for row 2" }), { target: { value: "Child" } });

    expect(screen.getByRole("textbox", { name: "Name for row 2" })).toHaveValue("Child");
    fireEvent.click(screen.getByRole("button", { name: "Collapse row 1" }));
    expect(screen.queryByDisplayValue("Child")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand row 1" }));
    expect(screen.getByDisplayValue("Child")).toBeInTheDocument();
  });

  it("uses contextual column and row menus for table actions", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));

    expect(screen.queryByRole("button", { name: "Delete row 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Column actions for Name" }));
    const columnMenu = screen.getByRole("menu", { name: "Actions for Name column" });
    expect(columnMenu).toHaveTextContent("Rename");
    expect(columnMenu).toHaveTextContent("+ Add column");
    expect(columnMenu).toHaveTextContent("Delete column");

    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    const renameColumn = screen.getByRole("textbox", { name: "Rename Name column" });
    fireEvent.change(renameColumn, { target: { value: "Task" } });
    fireEvent.keyDown(renameColumn, { key: "Enter" });
    expect(screen.getByRole("button", { name: "Task" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Row actions for row 1" }));
    const rowMenu = screen.getByRole("menu", { name: "Actions for row 1" });
    expect(rowMenu).toHaveTextContent("+ Add subrow");
    expect(rowMenu).toHaveTextContent("Rename row");
    expect(rowMenu).toHaveTextContent("Delete row");
    for (const color of ["Cyan", "Green", "Yellow", "Red", "Purple"]) {
      expect(screen.getByRole("menuitem", { name: `Highlight row 1 ${color}` })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("menuitem", { name: "Highlight row 1 Green" }));
    expect(screen.getByRole("textbox", { name: "Task for row 1" }).closest("tr")).toHaveAttribute("data-row-highlight", "green");

    fireEvent.click(screen.getByRole("button", { name: "Row actions for row 1" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "+ Add subrow" }));
    expect(screen.getByRole("textbox", { name: "Task for row 2" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Row actions for row 1" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename row" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Task for row 1" })).toHaveFocus());

    fireEvent.click(screen.getByRole("button", { name: "Row actions for row 1" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Row actions for row 1" }), { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Actions for row 1" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ Column" }));
    expect(screen.queryByRole("button", { name: "Delete Task column" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "New column name" }), { target: { value: "Status" } });
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    fireEvent.click(screen.getByRole("button", { name: "Column actions for Status" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete column" }));
    expect(screen.queryByRole("button", { name: "Status" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Row actions for row 2" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete row" }));
    expect(screen.queryByRole("textbox", { name: "Task for row 2" })).not.toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalledTimes(2);
  });

  it("resizes columns and keeps row colors in the foreground actions menu", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    const resize = screen.getByRole("button", { name: "Resize Name column" });
    fireEvent.pointerDown(resize, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 180 });
    fireEvent.pointerUp(window);
    expect(resize.closest("th")).toHaveStyle({ width: "240px" });

    expect(screen.queryByRole("button", { name: "Row color for row 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Row actions for row 1" }));
    const menu = screen.getByRole("menu", { name: "Actions for row 1" });
    expect(menu).toHaveClass("notes-row-menu-portal");
    expect(menu).toHaveTextContent("Delete row");
    fireEvent.click(screen.getByRole("menuitem", { name: "Highlight row 1 Purple" }));
    expect(screen.getByRole("textbox", { name: "Name for row 1" }).closest("tr")).toHaveAttribute("data-row-highlight", "purple");
  });

  it("edits, sorts, and navigates the expanded table property types", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));

    fireEvent.click(screen.getByRole("button", { name: "Column actions for Name" }));
    const menu = screen.getByRole("menu", { name: "Actions for Name column" });
    expect(menu).toHaveTextContent("Edit column");
    expect(menu).toHaveTextContent("Sort ascending");
    expect(menu).toHaveTextContent("Sort descending");
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit column" }));
    expect(screen.getByRole("region", { name: "Edit Name column" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Edit Name type" }), { target: { value: "currency" } });
    expect(screen.getByRole("spinbutton", { name: "Name for row 1" })).toHaveAttribute("step", "0.01");

    fireEvent.change(screen.getByRole("spinbutton", { name: "Name for row 1" }), { target: { value: "25" } });
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Name for row 1" }), { key: "Enter" });
    expect(screen.getByRole("spinbutton", { name: "Name for row 2" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Column actions for Name" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sort descending" }));
    expect(screen.getByRole("button", { name: /Name ↓/ })).toBeInTheDocument();
    expect(document.querySelectorAll(".notes-table thead th")).toHaveLength(1);
    expect(document.querySelectorAll(".notes-table tbody tr:first-child td")).toHaveLength(1);
  });

  it("adds and removes status choices individually while preserving the cell dropdown", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add row" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Column" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New column name" }), { target: { value: "Status" } });
    fireEvent.change(screen.getByRole("combobox", { name: "New column type" }), { target: { value: "select" } });
    for (const option of ["Todo", "Doing", "Done"]) {
      const input = screen.getByRole("textbox", { name: "New column option" });
      fireEvent.change(input, { target: { value: option } });
      fireEvent.keyDown(input, { key: "Enter" });
    }
    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    expect(screen.getByRole("combobox", { name: "Status for row 1" })).toHaveTextContent("Doing");
    fireEvent.click(screen.getByRole("button", { name: "Remove Doing from Status" }));
    expect(screen.getByRole("combobox", { name: "Status for row 1" })).not.toHaveTextContent("Doing");
  });
});
