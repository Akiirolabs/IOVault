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
});
