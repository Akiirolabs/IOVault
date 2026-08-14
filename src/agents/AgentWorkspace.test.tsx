import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgentWorkspace from "./AgentWorkspace";
import { agentApi } from "./api";
import { startRealtimeVoice } from "./realtime";

vi.mock("./api", () => ({ agentApi: {
  migrate: vi.fn(), conversations: vi.fn(), createConversation: vi.fn(), conversation: vi.fn(), snapshot: vi.fn(),
  message: vi.fn(), cancel: vi.fn(), decide: vi.fn(), connectGoogle: vi.fn(), disconnectGoogle: vi.fn(),
  updatePolicy: vi.fn(), transcribe: vi.fn(), speak: vi.fn(), realtimeSecret: vi.fn(), saveRealtimeTranscript: vi.fn(),
} }));
vi.mock("./realtime", () => ({ startRealtimeVoice: vi.fn() }));

class EventSourceMock {
  static instances: EventSourceMock[] = [];
  onmessage: ((event: MessageEvent) => void | Promise<void>) | null = null;
  constructor(public url: string) { EventSourceMock.instances.push(this); }
  close = vi.fn();
}

const messages = Array.from({ length: 6 }, (_, index) => ({ id: `message-${index}`, role: index % 2 ? "assistant" as const : "user" as const, content: `Conversation message ${index + 1}` }));

beforeEach(() => {
  vi.clearAllMocks();
  EventSourceMock.instances = [];
  vi.stubGlobal("EventSource", EventSourceMock);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.mocked(agentApi.migrate).mockResolvedValue({ migrated: false });
  vi.mocked(agentApi.conversations).mockResolvedValue({ conversations: [{ id: "conversation-1", title: "Current" }] });
  vi.mocked(agentApi.conversation).mockResolvedValue({ conversation: { id: "conversation-1", title: "Current", messages } });
  vi.mocked(agentApi.snapshot).mockResolvedValue({ agent: "learning", profile: {}, policy: {}, connected: [], tasks: [], approvals: [], records: [] });
  vi.mocked(agentApi.realtimeSecret).mockResolvedValue({ value: "ephemeral-only", model: "gpt-realtime-2.1-mini" });
  vi.mocked(agentApi.saveRealtimeTranscript).mockResolvedValue({});
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Agent Workspace conversation and voice", () => {
  it("renders the complete durable transcript on the left with cloud status and explicit voice controls", async () => {
    render(<AgentWorkspace agent="learning" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    expect(await screen.findByText("Conversation message 6")).toBeInTheDocument();
    expect(screen.getByText("Conversation message 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Active conversation")).toContainElement(screen.getByText("Conversation saved to cloud"));
    expect(screen.getByRole("button", { name: "Start voice conversation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mute spoken replies" })).not.toBeInTheDocument();
  });

  it("starts and ends one continuous realtime session without legacy response TTS", async () => {
    const stop = vi.fn();
    vi.mocked(startRealtimeVoice).mockResolvedValue({ stop });
    render(<AgentWorkspace agent="learning" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    await screen.findByText("Conversation message 6");
    fireEvent.click(screen.getByRole("button", { name: "Start voice conversation" }));
    await waitFor(() => expect(startRealtimeVoice).toHaveBeenCalledWith(expect.objectContaining({ ephemeralKey: "ephemeral-only" })));
    fireEvent.click(await screen.findByRole("button", { name: "End voice conversation" }));
    expect(stop).toHaveBeenCalledTimes(1);
    expect(agentApi.speak).not.toHaveBeenCalled();
  });

  it("shows both final transcripts but persists only authenticated user turns", async () => {
    vi.mocked(startRealtimeVoice).mockImplementation(async (options) => {
      options.onTranscript({ role: "user", content: "Teach me closures", eventId: "turn-user-1" });
      options.onTranscript({ role: "assistant", content: "A closure retains lexical scope.", eventId: "turn-assistant-1" });
      return { stop: vi.fn() };
    });
    render(<AgentWorkspace agent="learning" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    await screen.findByText("Conversation message 6");
    fireEvent.click(screen.getByRole("button", { name: "Start voice conversation" }));
    expect(await screen.findByText("Teach me closures")).toBeInTheDocument();
    expect(screen.getByText("A closure retains lexical scope.")).toBeInTheDocument();
    await waitFor(() => expect(agentApi.saveRealtimeTranscript).toHaveBeenCalledWith("learning", "conversation-1", "Teach me closures", "turn-user-1"));
    expect(agentApi.saveRealtimeTranscript).toHaveBeenCalledTimes(1);
    await EventSourceMock.instances[0].onmessage?.({lastEventId:"40",data:JSON.stringify({type:"completed",data:{}})} as MessageEvent);
    expect(await screen.findByText("A closure retains lexical scope.")).toBeInTheDocument();
  });

  it("cancels a voice start safely when the button is pressed again", async () => {
    let resolveSecret!: (value: { value: string; model: string }) => void;
    vi.mocked(agentApi.realtimeSecret).mockReturnValue(new Promise((resolve) => { resolveSecret = resolve; }));
    render(<AgentWorkspace agent="learning" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    await screen.findByText("Conversation message 6");
    fireEvent.click(screen.getByRole("button", { name: "Start voice conversation" }));
    fireEvent.click(screen.getByRole("button", { name: "End voice conversation" }));
    resolveSecret({ value: "unused-ephemeral", model: "gpt-realtime-2.1-mini" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Start voice conversation" })).toBeInTheDocument());
    expect(startRealtimeVoice).not.toHaveBeenCalled();
  });

  it("stops an active realtime session when the workspace unmounts", async () => {
    const stop=vi.fn();vi.mocked(startRealtimeVoice).mockResolvedValue({stop});
    const view=render(<AgentWorkspace agent="career" legacyData={{}} onLegacyMigrated={vi.fn()} />);
    await screen.findByText("Conversation message 6");fireEvent.click(screen.getByRole("button",{name:"Start voice conversation"}));
    await screen.findByRole("button",{name:"End voice conversation"});view.unmount();expect(stop).toHaveBeenCalledTimes(1);
  });
});
