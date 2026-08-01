import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgentWorkspace from "./AgentWorkspace";
import { agentApi } from "./api";

vi.mock("./api", () => ({ agentApi: {
  migrate: vi.fn(), conversations: vi.fn(), createConversation: vi.fn(), conversation: vi.fn(), snapshot: vi.fn(),
  message: vi.fn(), cancel: vi.fn(), decide: vi.fn(), connectGoogle: vi.fn(), disconnectGoogle: vi.fn(),
  updatePolicy: vi.fn(), transcribe: vi.fn(), speak: vi.fn(),
} }));

class EventSourceMock {
  static instances: EventSourceMock[] = [];
  onmessage: ((event: MessageEvent) => void | Promise<void>) | null = null;
  constructor(public url: string) { EventSourceMock.instances.push(this); }
  close = vi.fn();
}

const messages = Array.from({ length: 6 }, (_, index) => ({ id: `message-${index}`, role: index % 2 ? "assistant" as const : "user" as const, content: `Conversation message ${index + 1}` }));

beforeEach(() => {
  EventSourceMock.instances = [];
  vi.stubGlobal("EventSource", EventSourceMock);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.mocked(agentApi.migrate).mockResolvedValue({ migrated: false });
  vi.mocked(agentApi.conversations).mockResolvedValue({ conversations: [{ id: "conversation-1", title: "Current" }] });
  vi.mocked(agentApi.conversation).mockResolvedValue({ conversation: { id: "conversation-1", title: "Current", messages } });
  vi.mocked(agentApi.snapshot).mockResolvedValue({ agent: "learning", profile: {}, policy: {}, connected: [], tasks: [], approvals: [], records: [] });
  vi.mocked(agentApi.speak).mockResolvedValue({ audioBase64: "audio", mimeType: "audio/mpeg" });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Agent Workspace conversation and voice", () => {
  it("renders the complete durable transcript on the left with cloud status and explicit voice controls", async () => {
    render(<AgentWorkspace agent="learning" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    expect(await screen.findByText("Conversation message 6")).toBeInTheDocument();
    expect(screen.getByText("Conversation message 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Active conversation")).toContainElement(screen.getByText("Saved to cloud"));
    expect(screen.getByRole("button", { name: "Push to talk" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute spoken replies" })).toBeInTheDocument();
  });

  it("does not reconnect or replay a completed voice event when spoken replies are muted", async () => {
    render(<AgentWorkspace agent="learning" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    await screen.findByText("Conversation message 6");
    await waitFor(() => expect(EventSourceMock.instances).toHaveLength(1));
    const event = { lastEventId: "12", data: JSON.stringify({ type: "completed", data: { answer: "Finished answer" } }) } as MessageEvent;
    await EventSourceMock.instances[0].onmessage?.(event);
    await EventSourceMock.instances[0].onmessage?.(event);
    await waitFor(() => expect(agentApi.speak).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Mute spoken replies" }));
    expect(EventSourceMock.instances).toHaveLength(1);
  });
});
