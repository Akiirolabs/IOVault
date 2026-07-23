import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: /Design brief/ })).toBeInTheDocument();
    const context = screen.getByRole("checkbox", { name: "Use this page with AI" });
    expect(context).not.toBeChecked();
    fireEvent.click(context);
    expect(context).toBeChecked();
  });

  it("archives and restores a page without deleting it", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
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

    expect(screen.getByRole("spinbutton", { name: "Estimate for row 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Due for row 1")).toHaveAttribute("type", "date");
    expect(screen.getByRole("checkbox", { name: "Complete for row 1" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status for row 1" })).toHaveTextContent("Doing");
    expect(screen.getByRole("textbox", { name: "Reference for row 1" })).toHaveAttribute("type", "url");

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
});
