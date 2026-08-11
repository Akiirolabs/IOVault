/**
 * IO Vault — main application UI.
 *
 * Flow: unlock screen → dashboard with workspace pages (Code, Write, Learning, Career, Projects).
 * Workspace authority is server-side SQLite with a user-scoped offline cache.
 */
import { FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import type { IconType } from "react-icons";
import { FaLinkedin } from "react-icons/fa";
import {
  HiOutlineAcademicCap,
  HiOutlineArrowsPointingOut,
  HiOutlineBeaker,
  HiOutlineBolt,
  HiOutlineBookOpen,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCheckBadge,
  HiOutlineClipboardDocumentList,
  HiOutlineCodeBracket,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineGlobeAlt,
  HiOutlineHeart,
  HiOutlineLightBulb,
  HiOutlineLink,
  HiOutlineMap,
  HiOutlineMusicalNote,
  HiOutlinePencilSquare,
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { SiCoursera, SiGithub, SiNotion } from "react-icons/si";
import CodeVaultWorkspace from "./codeVault/CodeVaultWorkspace";
import type { CodeSnippet } from "./codeVault/types";
import NotesWorkspace from "./notes/NotesWorkspace";
import { activeNoteContext, createInitialWriteState, normalizeWriteState, type WriteState } from "./notes/model";
import { ProjectFlowchartEditor, ProjectMindmapEditor, ProjectTableEditor } from "./projects/ProjectModes";
import { createProjectFlowchart, createProjectMindmap, createProjectTable, filterProjects, normalizeProjectBlock, reorderProjects, type ProjectBlock, type ProjectFilter, type ProjectStatus } from "./projects/model";
import AgentWorkspace from "./agents/AgentWorkspace";
import { apiFetch } from "./api";
import { claimLegacyWorkspace, hasUnclaimedLegacyWorkspace, readUserWorkspaceCacheRecord, removeUserWorkspaceCache, writeUserWorkspaceCache, type WorkspaceCacheSync } from "./vaultCache";
import { serializeWorkspaceUpload } from "./workspacePayload";
export { apiFetch } from "./api";

// --- Types: shape of each workspace page and full saved state ---

type PageKey = "code" | "write" | "learning" | "career" | "projects" | "settings";

type IconId =
  | "code"
  | "pencil"
  | "doc"
  | "book"
  | "cap"
  | "briefcase"
  | "folder"
  | "sparkles"
  | "bolt"
  | "calendar"
  | "clipboard"
  | "chart"
  | "cog"
  | "globe"
  | "heart"
  | "bulb"
  | "link"
  | "map"
  | "music"
  | "rocket"
  | "star"
  | "tag"
  | "users"
  | "beaker"
  | "badge";

type IconOption = {
  id: IconId;
  label: string;
  Icon: IconType;
};

const ICON_OPTIONS: IconOption[] = [
  { id: "code", label: "Code", Icon: HiOutlineCodeBracket },
  { id: "pencil", label: "Pencil", Icon: HiOutlinePencilSquare },
  { id: "doc", label: "Document", Icon: HiOutlineDocumentText },
  { id: "book", label: "Book", Icon: HiOutlineBookOpen },
  { id: "cap", label: "Academic cap", Icon: HiOutlineAcademicCap },
  { id: "briefcase", label: "Briefcase", Icon: HiOutlineBriefcase },
  { id: "folder", label: "Folder", Icon: HiOutlineFolder },
  { id: "sparkles", label: "Sparkles", Icon: HiOutlineSparkles },
  { id: "bolt", label: "Bolt", Icon: HiOutlineBolt },
  { id: "calendar", label: "Calendar", Icon: HiOutlineCalendarDays },
  { id: "clipboard", label: "Checklist", Icon: HiOutlineClipboardDocumentList },
  { id: "chart", label: "Chart", Icon: HiOutlineChartBar },
  { id: "cog", label: "Settings", Icon: HiOutlineCog6Tooth },
  { id: "globe", label: "Globe", Icon: HiOutlineGlobeAlt },
  { id: "heart", label: "Heart", Icon: HiOutlineHeart },
  { id: "bulb", label: "Lightbulb", Icon: HiOutlineLightBulb },
  { id: "link", label: "Link", Icon: HiOutlineLink },
  { id: "map", label: "Map", Icon: HiOutlineMap },
  { id: "music", label: "Music", Icon: HiOutlineMusicalNote },
  { id: "rocket", label: "Rocket", Icon: HiOutlineRocketLaunch },
  { id: "star", label: "Star", Icon: HiOutlineStar },
  { id: "tag", label: "Tag", Icon: HiOutlineTag },
  { id: "users", label: "Users", Icon: HiOutlineUserGroup },
  { id: "beaker", label: "Lab", Icon: HiOutlineBeaker },
  { id: "badge", label: "Badge", Icon: HiOutlineCheckBadge },
];

const ICONS_BY_ID: Record<IconId, IconType> = ICON_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option.Icon;
    return acc;
  },
  {} as Record<IconId, IconType>,
);

type LearningConnection = {
  name: string;
  status: string;
  progress: number;
};

/** Result of a GitHub Actions test-status lookup (UI-only, not persisted) */
type GithubTestStatus = {
  state: "ok" | "error";
  message: string;
  run?: {
    name: string;
    status: string;
    conclusion: string | null;
    branch: string;
    commit: string;
    url: string;
    updatedAt: string;
  };
};

export type VaultState = {
  code: {
    language: string;
    editor: string;
    notesHtml: string;
    snippets: CodeSnippet[];
  };
  learning: {
    docHtml: string;
    connections: LearningConnection[];
    calendarFocus: string[];
  };
  career: {
    resume: string;
    aiDraft: string;
  };
  projects: {
    blocks: ProjectBlock[];
  };
  write: WriteState;
  github: {
    repo: string;
  };
  settings: {
    navIcons: Record<PageKey, IconId>;
    theme: {
      mode: "default" | "tinted" | "night" | "light";
      hue: number;
      glow: number;
      depth: number;
    };
  };
  assistant: {
    conversations: AgentConversation[];
    activeConversationId: string;
  };
};

export type AgentContext = { scope: PageKey | "selected"; data: unknown };

type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type AgentConversation = {
  id: string;
  title: string;
  messages: AgentMessage[];
  updatedAt: string;
};

function truncateAgentText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit)}\n[truncated]` : value;
}

function agentPlainText(html: string) {
  const element = document.createElement("div");
  element.innerHTML = html;
  return element.textContent || "";
}

export function buildAgentContext(page: PageKey, state: VaultState): AgentContext {
  if (page === "code") {
    return { scope: page, data: {
      language: state.code.language,
      editor: truncateAgentText(state.code.editor, 12_000),
      notes: truncateAgentText(agentPlainText(state.code.notesHtml), 8_000),
      snippets: state.code.snippets.slice(0, 5).map((snippet) => ({ title: snippet.title, language: snippet.language, code: truncateAgentText(snippet.code, 4_000) })),
      omittedSnippets: Math.max(0, state.code.snippets.length - 5),
    } };
  }
  if (page === "learning") {
    return { scope: page, data: {
      notes: truncateAgentText(agentPlainText(state.learning.docHtml), 20_000),
      connections: state.learning.connections.slice(0, 20),
      calendarFocus: state.learning.calendarFocus.slice(0, 20),
    } };
  }
  if (page === "career") {
    return { scope: page, data: { resume: truncateAgentText(state.career.resume, 30_000) } };
  }
  if (page === "projects") {
    return { scope: page, data: {
      projects: state.projects.blocks.slice(0, 20).map((block) => ({ id: block.id, title: block.title, status: block.status, body: truncateAgentText(block.body, 2_000) })),
      omittedProjects: Math.max(0, state.projects.blocks.length - 20),
    } };
  }
  if (page === "settings") return { scope: page, data: { theme: state.settings.theme } };
  const noteContext = activeNoteContext(state.write);
  return { scope: page, data: {
    ...noteContext,
    ...("document" in noteContext && typeof noteContext.document === "string" ? { document: truncateAgentText(agentPlainText(noteContext.document), 30_000) } : {}),
  } };
}

export function buildSelectedAgentContext(pages: PageKey[], state: VaultState, projectIds: string[] = []): AgentContext | undefined {
  const selected = [
    ...[...new Set(pages)].map((page) => buildAgentContext(page, state)),
    ...[...new Set(projectIds)].flatMap((projectId) => {
      const project = state.projects.blocks.find((block) => block.id === projectId);
      return project ? [{ scope: "projects" as const, data: { project: {
        id: project.id,
        title: project.title,
        status: project.status,
        body: truncateAgentText(project.body, 8_000),
        document: truncateAgentText(agentPlainText(project.docHtml || ""), 12_000),
        markdown: truncateAgentText(project.docMarkdown || "", 12_000),
      } } }] : [];
    }),
  ];
  if (selected.length === 0) return undefined;
  if (selected.length === 1) return selected[0];
  return { scope: "selected", data: { pages: selected } };
}

export function buildAgentConversationPrompt(messages: AgentMessage[], nextMessage: string) {
  const prefix = "Continue this conversation:\n\n";
  const suffix = `\n\nUser: ${nextMessage}`;
  const historyBudget = Math.max(0, 8_000 - prefix.length - suffix.length);
  const history = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n")
    .slice(-historyBudget);
  return history ? `${prefix}${history}${suffix}` : nextMessage.slice(0, 8_000);
}

type NavItem = {
  key: PageKey;
  label: string;
  defaultIcon: IconType;
};

// --- Navigation & defaults: sidebar labels and first-run sample content ---

const navItems: NavItem[] = [
  { key: "code", label: "Code Vault", defaultIcon: SiGithub },
  { key: "write", label: "Write", defaultIcon: HiOutlineDocumentText },
  { key: "learning", label: "Learning", defaultIcon: SiCoursera },
  { key: "career", label: "Career", defaultIcon: FaLinkedin },
  { key: "projects", label: "Projects", defaultIcon: SiNotion },
  { key: "settings", label: "Settings", defaultIcon: HiOutlineCog6Tooth },
];

/** Shown on first visit and used to fill missing fields when loading old saves */
const defaultVaultState: VaultState = {
  code: {
    language: "tsx",
    editor: `function WelcomeCard() {\n  return <section>IO Vault</section>;\n}\n`,
    notesHtml: "<h2>Code Notes</h2><p>Paste code, write implementation notes, and save snippets here.</p>",
    snippets: [
      {
        id: "snippet-1",
        title: "React component",
        language: "tsx",
        code: `type CardProps = {\n  title: string;\n};\n\nfunction Card({ title }: CardProps) {\n  return <article>{title}</article>;\n}`,
      },
      {
        id: "snippet-2",
        title: "Fetch helper",
        language: "ts",
        code: `async function getJson<T>(url: string): Promise<T> {\n  const response = await fetch(url);\n  if (!response.ok) throw new Error("Request failed");\n  return response.json();\n}`,
      },
    ],
  },
  write: createInitialWriteState(),
  github: {
    repo: "",
  },
  settings: {
    navIcons: {
      code: "code",
      write: "pencil",
      learning: "cap",
      career: "briefcase",
      projects: "folder",
      settings: "cog",
    },
    theme: { mode: "default", hue: 198, glow: 55, depth: 8 },
  },
  learning: {
    docHtml:
      "<h2>Learning Docs</h2><p>Use this space for documentation notes, course summaries, questions, and study plans.</p>",
    connections: [
      { name: "Coursera", status: "Ready to connect", progress: 0 },
      { name: "edX", status: "Ready to connect", progress: 0 },
      { name: "freeCodeCamp", status: "Manual tracking", progress: 35 },
      { name: "MIT OCW", status: "Manual tracking", progress: 15 },
    ],
    calendarFocus: ["Study", "Build", "Review", "Apply", "Read", "Practice", "Plan"],
  },
  career: {
    resume:
      "Your Name\nRole / Target Title\n\nSummary\nWrite a concise professional summary here.\n\nExperience\n- Add impact-focused bullets.\n\nProjects\n- Add projects with results.\n\nSkills\n- Add tools, languages, and platforms.",
    aiDraft: "Ask the AI to revise your resume. The revised version will appear here before you apply it.",
  },
  projects: {
    blocks: [
      {
        id: "project-1",
        title: "Lab Project",
        status: "In progress",
        body: "Goal, hypothesis, notes, files, blockers, and next steps.",
      },
      {
        id: "project-2",
        title: "Research Log",
        status: "Active",
        body: "Collect sources, observations, experiment notes, and decisions.",
      },
    ],
  },
  assistant: {
    activeConversationId: "assistant-welcome",
    conversations: [
      {
        id: "assistant-welcome",
        title: "New conversation",
        updatedAt: new Date(0).toISOString(),
        messages: [
          {
            id: "assistant-welcome-message",
            role: "assistant",
            content: "Ask the agent anything or have it search this workspace.",
            createdAt: new Date(0).toISOString(),
          },
        ],
      },
    ],
  },
};

// --- Persistence: read/write localStorage safely ---

/** Merges saved JSON with defaults so partial or legacy data never crashes the app */
function normalizeVaultState(raw: unknown): VaultState {
  if (!raw || typeof raw !== "object") return defaultVaultState;

  const parsed = raw as Partial<VaultState>;
  const conversations = Array.isArray(parsed.assistant?.conversations)
    ? parsed.assistant.conversations.filter((conversation): conversation is AgentConversation =>
        Boolean(conversation && typeof conversation.id === "string" && typeof conversation.title === "string" && Array.isArray(conversation.messages)),
      ).slice(0, 8).map((conversation) => ({
        ...conversation,
        title: conversation.title.slice(0, 60),
        messages: conversation.messages.filter((message) => message
          && typeof message.id === "string"
          && (message.role === "user" || message.role === "assistant")
          && typeof message.content === "string")
          .slice(-16)
          .map((message) => ({ ...message, content: message.content.slice(0, 8_000) })),
      }))
    : defaultVaultState.assistant.conversations;
  const activeConversationId = conversations.some((conversation) => conversation.id === parsed.assistant?.activeConversationId)
    ? String(parsed.assistant?.activeConversationId)
    : conversations[0]?.id || defaultVaultState.assistant.activeConversationId;

  return {
    code: {
      ...defaultVaultState.code,
      ...(typeof parsed.code === "object" && parsed.code ? parsed.code : {}),
      snippets: Array.isArray(parsed.code?.snippets)
        ? parsed.code.snippets
        : defaultVaultState.code.snippets,
    },
    learning: {
      ...defaultVaultState.learning,
      ...(typeof parsed.learning === "object" && parsed.learning ? parsed.learning : {}),
      connections: Array.isArray(parsed.learning?.connections)
        ? parsed.learning.connections
        : defaultVaultState.learning.connections,
      calendarFocus: Array.isArray(parsed.learning?.calendarFocus)
        ? parsed.learning.calendarFocus
        : defaultVaultState.learning.calendarFocus,
    },
    career: {
      ...defaultVaultState.career,
      ...(typeof parsed.career === "object" && parsed.career ? parsed.career : {}),
    },
    write: normalizeWriteState(parsed.write),
    github: {
      ...defaultVaultState.github,
      ...(typeof parsed.github === "object" && parsed.github ? parsed.github : {}),
    },
    settings: {
      ...defaultVaultState.settings,
      ...(typeof parsed.settings === "object" && parsed.settings ? parsed.settings : {}),
      navIcons:
        typeof parsed.settings?.navIcons === "object" && parsed.settings?.navIcons
          ? { ...defaultVaultState.settings.navIcons, ...(parsed.settings.navIcons as Record<string, unknown>) }
          : defaultVaultState.settings.navIcons,
      theme: (() => {
        const theme = parsed.settings?.theme;
        const clamp = (value: unknown, minimum: number, maximum: number, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
        return {
          mode: theme?.mode === "default" || theme?.mode === "tinted" || theme?.mode === "night" || theme?.mode === "light" ? theme.mode : "default",
          hue: clamp(theme?.hue, 0, 360, defaultVaultState.settings.theme.hue),
          glow: clamp(theme?.glow, 20, 100, defaultVaultState.settings.theme.glow),
          depth: clamp(theme?.depth, 0, 20, defaultVaultState.settings.theme.depth),
        };
      })(),
    },
    projects: {
      blocks: Array.isArray(parsed.projects?.blocks)
        ? parsed.projects.blocks.map(normalizeProjectBlock).filter((block): block is ProjectBlock => block !== null)
        : defaultVaultState.projects.blocks,
    },
    assistant: { conversations, activeConversationId },
  };
}

function getUserCachedVaultState(userId: string) {
  const saved = readUserWorkspaceCacheRecord(userId);
  return saved ? { state: normalizeVaultState(saved.state), sync: saved.sync } : null;
}

// --- Code preview: lightweight syntax highlighting (no external highlighter) ---

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(code: string) {
  if (typeof code !== "string") return "";
  return escapeHtml(code)
    .replace(/\b(const|let|var|function|return|type|interface|async|await|if|else|throw|new)\b/g, '<span class="token keyword">$1</span>')
    .replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, '<span class="token string">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="token number">$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="token type">$1</span>');
}

// --- Offline fallback when API is unavailable (greetings, time, simple math) ---

function answerBasicQuestion(question: string) {
  if (/^(hi|hello|hey)\b/.test(question)) {
    return "Hey. I can help write, organize, revise, search, and plan inside IO Vault.";
  }

  if (question.includes("time")) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }

  if (question.includes("date") || question.includes("today")) {
    return `Today is ${new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.`;
  }

  const mathMatch = question.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);

  if (mathMatch) {
    const left = Number(mathMatch[1]);
    const operator = mathMatch[2];
    const right = Number(mathMatch[3]);
    const result =
      operator === "+"
        ? left + right
        : operator === "-"
          ? left - right
          : operator === "*"
            ? left * right
            : right === 0
              ? "undefined"
              : left / right;

    return `${mathMatch[1]} ${operator} ${mathMatch[3]} = ${result}`;
  }

  return null;
}

// --- Rich text editor: uncontrolled contentEditable ---
// The DOM content is seeded once on mount from `html`, then left uncontrolled.
// Re-binding `dangerouslySetInnerHTML` to state on every keystroke would make
// React reset innerHTML each input, sending the caret to the start and
// producing reversed text. `onChange` still fires so edits persist to state.

type RichTextEditorProps = {
  html: string;
  onChange: (html: string) => void;
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaMultiline?: boolean;
};

function RichTextEditor({ html, onChange, className, role, ariaLabel, ariaMultiline }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node && node.innerHTML !== html) {
      node.innerHTML = html;
    }
    // Seed once on mount only; the element is uncontrolled while editing.
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      role={role}
      aria-label={ariaLabel}
      aria-multiline={ariaMultiline}
      onInput={(event) => onChange(event.currentTarget.innerHTML)}
    />
  );
}

// --- Auth: HttpOnly cookie session + sign-in screen ---

type AuthUser = { id: string; email: string };

function AuthScreen({ onAuthed }: { onAuthed: (user: AuthUser, isSignup: boolean) => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };

      if (!response.ok || !data.user) {
        throw new Error(data.error || "Something went wrong.");
      }

      await onAuthed(data.user, mode === "signup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="home-screen" aria-label="IO Vault sign in">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />
      <div className="grid-overlay" />
      <section className="title-wrap auth-wrap">
        <p className="kicker">Welcome to</p>
        <h1>IO Vault</h1>
        <form className="auth-form" onSubmit={submit}>
          <p className="auth-mode-label">
            {mode === "login" ? "Sign in to your vault" : "Create your vault"}
          </p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min 8 characters)"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-label="Password"
            required
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="unlock-button" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode((current) => (current === "login" ? "signup" : "login"));
            setError(null);
          }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}

// --- Text format menu: a single "A̲" trigger that opens formatting options ---

type FormatAction = {
  id: string;
  label: string;
  title: string;
  command?: string;
  value?: string;
  className?: string;
};

const FORMAT_ACTIONS: FormatAction[] = [
  { id: "heading", label: "H", title: "Heading", command: "formatBlock", value: "h2" },
  { id: "bold", label: "B", title: "Bold", command: "bold", className: "tf-bold" },
  { id: "italic", label: "I", title: "Italic", command: "italic", className: "tf-italic" },
  { id: "underline", label: "U", title: "Underline", command: "underline", className: "tf-underline" },
  { id: "strike", label: "S", title: "Strikethrough", command: "strikeThrough", className: "tf-strike" },
  { id: "highlight", label: "A", title: "Highlight", command: "hiliteColor", value: "#a3e635", className: "tf-highlight" },
  { id: "bullet", label: "•", title: "Bulleted list", command: "insertUnorderedList" },
  { id: "number", label: "1.", title: "Numbered list", command: "insertOrderedList" },
  { id: "link", label: "link", title: "Link" },
  { id: "code", label: "code", title: "Code" },
];

function TextFormatMenu({ onCommand }: { onCommand: (command: string, value?: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  function runAction(action: FormatAction) {
    if (action.id === "link") {
      const url = window.prompt("Link URL (https://...)");
      if (url) onCommand("createLink", url);
      return;
    }
    if (action.id === "code") {
      const selected = window.getSelection()?.toString() ?? "";
      onCommand("insertHTML", `<code>${escapeHtml(selected)}</code>`);
      return;
    }
    if (action.command) onCommand(action.command, action.value);
  }

  return (
    <div className="text-format" ref={containerRef}>
      <button
        type="button"
        className="text-format-trigger"
        data-tooltip="Text Format"
        aria-label="Text Format"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onMouseDown={(event) => {
          event.preventDefault();
          setIsOpen((open) => !open);
        }}
      >
        <span className="tf-a">A</span>
      </button>

      {isOpen && (
        <div className="text-format-menu" role="menu" aria-label="Text format options">
          {FORMAT_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={`tf-option ${action.className ?? ""}`}
              title={action.title}
              aria-label={action.title}
              onMouseDown={(event) => {
                event.preventDefault();
                runAction(action);
              }}
            >
              {action.id === "link" ? (
                <HiOutlineLink aria-hidden="true" />
              ) : action.id === "code" ? (
                <HiOutlineCodeBracket aria-hidden="true" />
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  // --- UI state (not persisted): which screen/panels are open ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("code");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>("snippet-1");
  const [vaultState, setVaultState] = useState<VaultState>(defaultVaultState);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [selectedAgentContexts, setSelectedAgentContexts] = useState<PageKey[]>([]);
  const [selectedProjectContexts, setSelectedProjectContexts] = useState<string[]>([]);
  const [isAgentContextOpen, setIsAgentContextOpen] = useState(false);
  const [isAgentHistoryOpen, setIsAgentHistoryOpen] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [githubStatus, setGithubStatus] = useState<GithubTestStatus | null>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [projectDocMode, setProjectDocMode] = useState<"rich" | "markdown" | "table" | "flowchart" | "mindmap">("rich");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null);
  const [isProjectBoardMenuOpen, setIsProjectBoardMenuOpen] = useState(false);
  const [projectDropTarget, setProjectDropTarget] = useState<{ id: string; position: "before" | "after" } | null>(null);
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error" | "local-only" | "unsynced" | "cache-error">("idle");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutProtectionMessage, setSignOutProtectionMessage] = useState<string | null>(null);
  const syncTimer = useRef<number | null>(null);
  const activeAuthUserId = useRef<string | null>(null);
  const latestVaultState = useRef<VaultState>(defaultVaultState);
  const latestVaultRevision = useRef(0);
  const latestCacheWriteFailed = useRef(false);
  const lastServerUpdatedAt = useRef<string | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const agentMessagesRef = useRef<HTMLDivElement>(null);

  // --- Derived values for the active page / snippet / project counts ---
  const activeSnippet = vaultState.code.snippets.find((snippet) => snippet.id === activeSnippetId);
  const activeNavItem = navItems.find((item) => item.key === activePage) || navItems[0];
  const activeConversation = vaultState.assistant.conversations.find((conversation) => conversation.id === vaultState.assistant.activeConversationId)
    || vaultState.assistant.conversations[0];
  const activeNavIconId = vaultState.settings.navIcons[activeNavItem.key];
  const ActivePageIcon = (activeNavIconId && ICONS_BY_ID[activeNavIconId]) || activeNavItem.defaultIcon;
  const openProject = vaultState.projects.blocks.find((block) => block.id === openProjectId) || null;
  const themeStyle = {
    "--theme-hue": vaultState.settings.theme.hue,
    "--theme-glow": `${vaultState.settings.theme.glow}%`,
    "--theme-depth": `${vaultState.settings.theme.depth}%`,
  } as CSSProperties;
  const projectStats = useMemo(() => {
    const active = vaultState.projects.blocks.filter((block) => block.status === "Active").length;
    const progress = vaultState.projects.blocks.filter((block) => block.status === "In progress").length;
    const done = vaultState.projects.blocks.filter((block) => block.status === "Done").length;
    return { active, progress, done, total: vaultState.projects.blocks.length };
  }, [vaultState.projects.blocks]);

  useEffect(() => {
    agentMessagesRef.current?.scrollTo({ top: agentMessagesRef.current.scrollHeight, behavior: "smooth" });
  }, [activeConversation?.messages.length, isAssistantLoading]);
  useEffect(() => {
    if (!openProjectId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [openProjectId]);
  const filteredProjects = filterProjects(vaultState.projects.blocks, projectFilter);

  // --- State updaters: every change writes through to localStorage ---

  function saveVaultState(reducer: (previous: VaultState) => VaultState) {
    setVaultState((previous) => {
      const nextState = reducer(previous);
      setSignOutProtectionMessage(null);
      latestVaultState.current = nextState;
      latestVaultRevision.current += 1;
      const localOnly = !serializeWorkspaceUpload(nextState).withinBudget;
      const sync: WorkspaceCacheSync = {
        dirty: true,
        localOnly,
        revision: latestVaultRevision.current,
        updatedAt: new Date().toISOString(),
        lastServerUpdatedAt: lastServerUpdatedAt.current,
      };
      latestCacheWriteFailed.current = authUser ? !writeUserWorkspaceCache(authUser.id, nextState, sync) : false;
      if (latestCacheWriteFailed.current) setSyncState("cache-error");
      scheduleServerSync(nextState, latestVaultRevision.current);
      return nextState;
    });
  }

  // --- Server sync: persist the VaultState to the SQL backend per user ---

  function enqueueVaultSave(state: VaultState, revision: number, userId: string) {
    const payload = serializeWorkspaceUpload(state);
    if (!payload.withinBudget) {
      if (activeAuthUserId.current === userId && revision === latestVaultRevision.current) {
        setSyncState(latestCacheWriteFailed.current ? "cache-error" : "local-only");
      }
      return Promise.resolve(false);
    }
    setSyncState("saving");
    const execute = async () => {
      if (activeAuthUserId.current !== userId) return false;
      try {
        const response = await apiFetch("/api/vault", {
          method: "PUT",
          body: payload.body,
        });
        if (!response.ok) throw new Error("save failed");
        if (activeAuthUserId.current === userId && revision === latestVaultRevision.current) {
          latestCacheWriteFailed.current = !writeUserWorkspaceCache(userId, state, {
            dirty: false,
            localOnly: false,
            revision,
            updatedAt: new Date().toISOString(),
            lastServerUpdatedAt: lastServerUpdatedAt.current,
          });
          setSyncState(latestCacheWriteFailed.current ? "cache-error" : "saved");
        }
        return true;
      } catch {
        if (activeAuthUserId.current === userId && revision === latestVaultRevision.current) {
          setSyncState(latestCacheWriteFailed.current ? "cache-error" : "error");
        }
        return false;
      }
    };
    const result = saveQueue.current.then(execute, execute);
    saveQueue.current = result.then(() => undefined, () => undefined);
    return result;
  }

  /** Debounced push so we don't hit the DB on every keystroke. */
  function scheduleServerSync(state: VaultState, revision: number) {
    if (!authUser) return;
    const userId = authUser.id;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    if (!serializeWorkspaceUpload(state).withinBudget) {
      syncTimer.current = null;
      setSyncState(latestCacheWriteFailed.current ? "cache-error" : "local-only");
      return;
    }
    syncTimer.current = window.setTimeout(() => {
      syncTimer.current = null;
      void enqueueVaultSave(state, revision, userId);
    }, 800);
  }

  async function loadVaultFromServer(user: AuthUser, offerLegacyMigration: boolean) {
    const userId = user.id;
    setIsWorkspaceLoading(true);
    latestVaultState.current = defaultVaultState;
    latestVaultRevision.current = 0;
    latestCacheWriteFailed.current = false;
    lastServerUpdatedAt.current = null;
    setVaultState(defaultVaultState);
    try {
      const response = await apiFetch("/api/vault");
      if (!response.ok) throw new Error("load failed");
      const { data, updatedAt } = (await response.json()) as { data: unknown; updatedAt?: string | null };
      if (activeAuthUserId.current !== userId) return;
      const cached = getUserCachedVaultState(userId);
      lastServerUpdatedAt.current = typeof updatedAt === "string" ? updatedAt : cached?.sync.lastServerUpdatedAt || null;

      if (cached && (cached.sync.dirty || cached.sync.localOnly)) {
        latestVaultState.current = cached.state;
        latestVaultRevision.current = cached.sync.revision;
        setVaultState(cached.state);
        setSyncState(cached.sync.localOnly ? "local-only" : "unsynced");
        return;
      }

      if (data) {
        const normalized = normalizeVaultState(data);
        latestVaultState.current = normalized;
        latestVaultRevision.current = cached?.sync.revision || 0;
        setVaultState(normalized);
        latestCacheWriteFailed.current = !writeUserWorkspaceCache(userId, normalized, {
          dirty: false,
          localOnly: false,
          revision: latestVaultRevision.current,
          updatedAt: new Date().toISOString(),
          lastServerUpdatedAt: lastServerUpdatedAt.current,
        });
        if (latestCacheWriteFailed.current) setSyncState("cache-error");
      } else {
        let local: VaultState | null = null;
        if (!local && offerLegacyMigration && hasUnclaimedLegacyWorkspace()) {
          const confirmed = window.confirm("Import the legacy workspace saved in this browser into this account?");
          const legacy = claimLegacyWorkspace(userId, confirmed);
          local = legacy ? normalizeVaultState(legacy) : null;
        }
        const initial = local || defaultVaultState;
        latestVaultState.current = initial;
        latestVaultRevision.current = local ? 1 : 0;
        setVaultState(initial);
        latestCacheWriteFailed.current = !writeUserWorkspaceCache(userId, initial, {
          dirty: Boolean(local),
          localOnly: false,
          revision: latestVaultRevision.current,
          updatedAt: new Date().toISOString(),
          lastServerUpdatedAt: lastServerUpdatedAt.current,
        });
        if (latestCacheWriteFailed.current) setSyncState("cache-error");
        if (local) await enqueueVaultSave(initial, latestVaultRevision.current, userId);
      }
    } catch {
      if (activeAuthUserId.current !== userId) return;
      const local = getUserCachedVaultState(userId);
      const fallback = local?.state || defaultVaultState;
      latestVaultState.current = fallback;
      latestVaultRevision.current = local?.sync.revision || 0;
      lastServerUpdatedAt.current = local?.sync.lastServerUpdatedAt || null;
      setVaultState(fallback);
      setSyncState(local?.sync.localOnly ? "local-only" : local?.sync.dirty ? "unsynced" : "error");
    } finally {
      if (activeAuthUserId.current === userId) setIsWorkspaceLoading(false);
    }
  }

  async function handleAuthed(user: AuthUser, isSignup: boolean) {
    activeAuthUserId.current = user.id;
    setAuthUser(user);
    await loadVaultFromServer(user, isSignup);
  }

  async function signOut() {
    const user = authUser;
    if (!user || isSigningOut) return;
    if (syncTimer.current) {
      window.clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
    setIsSigningOut(true);
    setSignOutProtectionMessage(null);
    const saved = await enqueueVaultSave(latestVaultState.current, latestVaultRevision.current, user.id);
    if (!saved || activeAuthUserId.current !== user.id) {
      setSignOutProtectionMessage(
        latestCacheWriteFailed.current
          ? "Browser storage failed. Manually copy important content, free browser storage without clearing IO Vault site data, then retry."
          : !serializeWorkspaceUpload(latestVaultState.current).withinBudget
            ? "Workspace is too large for cloud sync. Your work remains saved in this browser. Reduce unneeded Projects content, then retry."
            : "Sign out was blocked to protect unsaved changes. Retry when connected.",
      );
      setIsSigningOut(false);
      return;
    }
    try {
      const response = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout failed");
    } catch {
      setSyncState("error");
      setSignOutProtectionMessage("Sign out was blocked to protect unsaved changes. Retry when connected.");
      setIsSigningOut(false);
      return;
    }
    localStorage.removeItem("io-vault-token");
    removeUserWorkspaceCache(user.id);
    activeAuthUserId.current = null;
    latestVaultState.current = defaultVaultState;
    latestVaultRevision.current = 0;
    latestCacheWriteFailed.current = false;
    lastServerUpdatedAt.current = null;
    setAuthUser(null);
    setIsUnlocked(false);
    setVaultState(defaultVaultState);
    setSyncState("idle");
    setSignOutProtectionMessage(null);
    setIsSigningOut(false);
  }

  // On mount: verify the HttpOnly cookie session and remove the legacy local token.
  useEffect(() => {
    localStorage.removeItem("io-vault-token");

    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch("/api/auth/me");
        if (!response.ok) throw new Error("invalid session");
        const { user } = (await response.json()) as { user: AuthUser };
        if (cancelled) return;
        activeAuthUserId.current = user.id;
        setAuthUser(user);
        await loadVaultFromServer(user, true);
      } catch {
        // No valid cookie session; the sign-in screen will be shown.
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncLabel =
    syncState === "saving"
      ? "Saving…"
      : syncState === "error"
        ? "Offline"
        : syncState === "local-only"
          ? "Local only — too large"
          : syncState === "unsynced"
            ? "Local changes pending"
          : syncState === "cache-error"
            ? "Local save failed"
        : syncState === "saved"
          ? "Saved to cloud"
          : "Synced";

  function updateCode(updates: Partial<VaultState["code"]>) {
    saveVaultState((prev) => ({ ...prev, code: { ...prev.code, ...updates } }));
  }

  function updateWrite(updates: Partial<VaultState["write"]>) {
    saveVaultState((prev) => ({ ...prev, write: { ...prev.write, ...updates } }));
  }

  function updateGithub(updates: Partial<VaultState["github"]>) {
    saveVaultState((prev) => ({ ...prev, github: { ...prev.github, ...updates } }));
  }

  // --- GitHub: latest Actions test status via the public GitHub API ---

  async function checkGithubTests() {
    const repo = vaultState.github.repo
      .trim()
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/\/+$/, "");

    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      setGithubStatus({ state: "error", message: "Enter a repository as owner/repository." });
      return;
    }

    setIsGithubLoading(true);
    setGithubStatus(null);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/actions/runs?per_page=1`,
        { headers: { Accept: "application/vnd.github+json" } },
      );

      if (response.status === 404) {
        throw new Error("Repository not found or it has no public Actions.");
      }
      if (response.status === 403) {
        throw new Error("GitHub API rate limit reached. Try again later.");
      }
      if (!response.ok) {
        throw new Error(`GitHub API error (${response.status}).`);
      }

      const data = (await response.json()) as {
        workflow_runs?: Array<{
          name?: string;
          display_title?: string;
          status?: string;
          conclusion?: string | null;
          head_branch?: string;
          head_commit?: { message?: string };
          html_url?: string;
          updated_at?: string;
        }>;
      };
      const run = data.workflow_runs?.[0];

      if (!run) {
        setGithubStatus({ state: "ok", message: `No workflow runs found for ${repo}.` });
        return;
      }

      setGithubStatus({
        state: "ok",
        message: `Latest run for ${repo}`,
        run: {
          name: run.name || run.display_title || "Workflow",
          status: run.status || "unknown",
          conclusion: run.conclusion ?? null,
          branch: run.head_branch || "—",
          commit: run.head_commit?.message?.split("\n")[0] || "—",
          url: run.html_url || `https://github.com/${repo}/actions`,
          updatedAt: run.updated_at ? new Date(run.updated_at).toLocaleString() : "—",
        },
      });
    } catch (error) {
      setGithubStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Could not check tests.",
      });
    } finally {
      setIsGithubLoading(false);
    }
  }

  function updateSettings(updates: Partial<VaultState["settings"]>) {
    saveVaultState((prev) => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }

  function setNavIcon(page: PageKey, iconId: IconId) {
    updateSettings({
      navIcons: {
        ...vaultState.settings.navIcons,
        [page]: iconId,
      },
    });
  }

  function applyWriteFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
  }

  function updateAssistant(reducer: (assistant: VaultState["assistant"]) => VaultState["assistant"]) {
    saveVaultState((prev) => ({ ...prev, assistant: reducer(prev.assistant) }));
  }

  function appendAssistantMessage(conversationId: string, message: AgentMessage) {
    updateAssistant((assistant) => ({
      ...assistant,
      conversations: assistant.conversations.map((conversation) => conversation.id === conversationId
        ? { ...conversation, messages: [...conversation.messages, { ...message, content: message.content.slice(0, 8_000) }].slice(-16), updatedAt: message.createdAt }
        : conversation),
    }));
  }

  function startAssistantConversation() {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    updateAssistant((assistant) => ({
      activeConversationId: id,
      conversations: [
        {
          id,
          title: "New conversation",
          updatedAt: now,
          messages: [],
        },
        ...assistant.conversations,
      ].slice(0, 8),
    }));
    setAssistantQuestion("");
    setIsAgentHistoryOpen(false);
  }

  function selectAssistantConversation(id: string) {
    updateAssistant((assistant) => ({ ...assistant, activeConversationId: id }));
    setIsAgentHistoryOpen(false);
  }

  function updateProject(id: string, updates: Partial<ProjectBlock>) {
    saveVaultState((prev) => ({
      ...prev,
      projects: {
        ...prev.projects,
        blocks: prev.projects.blocks.map((block) =>
          block.id === id ? { ...block, ...updates } : block,
        ),
      },
    }));
  }

  function deleteProject(id: string) {
    const project = vaultState.projects.blocks.find((block) => block.id === id);
    if (!project || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    saveVaultState((prev) => ({ ...prev, projects: { ...prev.projects, blocks: prev.projects.blocks.filter((block) => block.id !== id) } }));
    if (openProjectId === id) setOpenProjectId(null);
    setSelectedProjectContexts((ids) => ids.filter((projectId) => projectId !== id));
  }

  function reorderProject(projectId: string, targetId: string, position: "before" | "after") {
    if (projectId === targetId) return;
    saveVaultState((prev) => ({ ...prev, projects: { ...prev.projects, blocks: reorderProjects(prev.projects.blocks, projectId, targetId, position) } }));
    setDraggedProjectId(null);
    setProjectDropTarget(null);
  }

  function sortProjects(mode: "title" | "status") {
    const statusRank: Record<ProjectStatus, number> = { Active: 0, "In progress": 1, Done: 2 };
    saveVaultState((prev) => ({ ...prev, projects: { ...prev.projects, blocks: [...prev.projects.blocks].sort((left, right) => mode === "title"
      ? left.title.localeCompare(right.title)
      : statusRank[left.status] - statusRank[right.status] || left.title.localeCompare(right.title)) } }));
    setIsProjectBoardMenuOpen(false);
  }

  function sendProjectToAssistant(project: ProjectBlock) {
    setSelectedProjectContexts((ids) => [...new Set([...ids, project.id])]);
    setProjectMenuId(null);
    setIsAgentOpen(true);
    setIsAgentContextOpen(true);
  }

  function openProjectMode(project: ProjectBlock, mode: "table" | "flowchart" | "mindmap") {
    if (mode === "table" && !project.table) updateProject(project.id, { table: createProjectTable() });
    if (mode === "flowchart" && !project.flowchart) updateProject(project.id, { flowchart: createProjectFlowchart() });
    if (mode === "mindmap" && !project.mindmap) updateProject(project.id, { mindmap: createProjectMindmap() });
    setProjectDocMode(mode);
    setOpenProjectId(project.id);
    setProjectMenuId(null);
  }

  function addSnippet() {
    const id = crypto.randomUUID();

    saveVaultState((prev) => {
      const snippet: CodeSnippet = {
        id,
        title: `Snippet ${prev.code.snippets.length + 1}`,
        language: prev.code.language,
        code: prev.code.editor,
      };
      return { ...prev, code: { ...prev.code, snippets: [snippet, ...prev.code.snippets] } };
    });
    setActiveSnippetId(id);
  }

  /** Wraps the current textarea selection with Markdown syntax in the open project page */
  function wrapProjectMarkdown(before: string, after: string) {
    const element = markdownRef.current;
    if (!element || openProjectId === null) return;

    const { selectionStart, selectionEnd, value } = element;
    const selected = value.slice(selectionStart, selectionEnd);
    const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);

    updateProject(openProjectId, { docMarkdown: next });

    // Restore focus + caret after React re-renders the controlled textarea.
    requestAnimationFrame(() => {
      element.focus();
      const caret = selectionStart + before.length + selected.length + after.length;
      element.setSelectionRange(caret, caret);
    });
  }

  function addProjectBlock(template: "blank" | "research" | "launch" = "blank") {
    const templates = {
      blank: { title: "Untitled Project", body: "Write project context, notes, links, and next steps.", docHtml: "" },
      research: { title: "Research Project", body: "Define the question, sources, observations, and next decision.", docHtml: "<h2>Research question</h2><p></p><h2>Sources and evidence</h2><p></p><h2>Findings</h2><p></p>" },
      launch: { title: "Launch Plan", body: "Track scope, milestones, risks, owners, and release readiness.", docHtml: "<h2>Outcome</h2><p></p><h2>Milestones</h2><ul><li></li></ul><h2>Risks</h2><p></p>" },
    } as const;
    const selectedTemplate = templates[template];
    const block: ProjectBlock = {
      id: crypto.randomUUID(),
      title: selectedTemplate.title,
      status: "Active",
      body: selectedTemplate.body,
      docHtml: selectedTemplate.docHtml,
    };

    saveVaultState((prev) => ({
      ...prev,
      projects: { ...prev.projects, blocks: [block, ...prev.projects.blocks] },
    }));
    setIsProjectBoardMenuOpen(false);
  }

  // --- AI: shared fetch to /api/agent (proxied to Express in dev) ---

  async function requestAgent(message: string, context?: AgentContext) {
    const response = await apiFetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ message, ...(context ? { context } : {}) }),
    });
    const data = (await response.json()) as { answer?: string; error?: string };

    if (!response.ok) throw new Error(data.error || "AI request failed.");
    return data.answer || "I could not generate an answer.";
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = assistantQuestion.trim();

    if (!prompt) {
      return;
    }

    const conversation = activeConversation;
    if (!conversation) return;

    const now = new Date().toISOString();
    const userMessage: AgentMessage = { id: crypto.randomUUID(), role: "user", content: prompt, createdAt: now };
    const requestPrompt = buildAgentConversationPrompt(conversation.messages, prompt);
    appendAssistantMessage(conversation.id, userMessage);
    if (conversation.title === "New conversation") {
      updateAssistant((assistant) => ({
        ...assistant,
        conversations: assistant.conversations.map((item) => item.id === conversation.id
          ? { ...item, title: prompt.slice(0, 44) || "New conversation" }
          : item),
      }));
    }
    setAssistantQuestion("");

    setIsAssistantLoading(true);

    try {
      const answer = await requestAgent(requestPrompt, buildSelectedAgentContext(selectedAgentContexts, vaultState, selectedProjectContexts));
      appendAssistantMessage(conversation.id, { id: crypto.randomUUID(), role: "assistant", content: answer, createdAt: new Date().toISOString() });
    } catch (error) {
      const fallback = answerBasicQuestion(prompt.toLowerCase());
      appendAssistantMessage(conversation.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fallback || `${error instanceof Error ? error.message : "AI request failed."} Local fallback did not find an answer.`,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsAssistantLoading(false);
    }
  }

  // --- Global AI drawer: available on unlock screen and all workspace pages ---

  const agentDrawer = (
    <>
      <button
        className="agent-toggle"
        type="button"
        onClick={() => setIsAgentOpen((current) => !current)}
        aria-expanded={isAgentOpen}
        aria-controls="global-agent"
      >
        Agent
      </button>

      <aside className={`agent-drawer ${isAgentOpen ? "open" : ""}`} id="global-agent">
        <div className="agent-head">
          <div>
            <p className="kicker">AI Agent</p>
            <h2>IO Assistant</h2>
          </div>
          <div className="agent-head-actions">
            <button
              type="button"
              className="agent-menu-trigger"
              onClick={() => setIsAgentHistoryOpen((open) => !open)}
              aria-label="Open chat history"
              aria-expanded={isAgentHistoryOpen}
            >
              ⋯
            </button>
            <button type="button" onClick={() => setIsAgentOpen(false)} aria-label="Close agent">Close</button>
          </div>
          {isAgentHistoryOpen && (
            <div className="agent-history-menu" role="menu" aria-label="Chat history">
              <button type="button" className="agent-new-chat" onClick={startAssistantConversation}>+ New chat</button>
              <div className="agent-history-list">
                {vaultState.assistant.conversations.map((conversation) => (
                  <button
                    type="button"
                    role="menuitem"
                    className={conversation.id === activeConversation?.id ? "active" : ""}
                    key={conversation.id}
                    onClick={() => selectAssistantConversation(conversation.id)}
                  >
                    <strong>{conversation.title}</strong>
                    <small>{new Date(conversation.updatedAt).toLocaleDateString()}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="agent-conversation" ref={agentMessagesRef} aria-live="polite">
          {activeConversation?.messages.length ? activeConversation.messages.map((message) => (
            <article className={`agent-message ${message.role}`} key={message.id}>
              <span>{message.role === "user" ? "You" : "IO"}</span>
              <div className="agent-response"><ReactMarkdown>{message.content}</ReactMarkdown></div>
            </article>
          )) : (
            <div className="agent-empty">
              <h3>Start a conversation</h3>
              <p>Ask a question, plan work, or explicitly add workspace context.</p>
            </div>
          )}
          {isAssistantLoading && <div className="agent-thinking">Thinking…</div>}
        </div>

        <div className="agent-composer-wrap">
          {isAgentContextOpen && (
            <div className="agent-context-panel">
              <div className="agent-context-heading"><strong>Context</strong><small>Only selected pages are submitted</small></div>
              {selectedAgentContexts.length > 0 ? selectedAgentContexts.map((page) => {
                const item = navItems.find((navItem) => navItem.key === page);
                return (
                  <div className="agent-context-item" key={page}>
                    <span>{item?.label || page}</span>
                    <button type="button" aria-label={`Remove ${item?.label || page} context`} onClick={() => setSelectedAgentContexts((items) => items.filter((itemPage) => itemPage !== page))}>×</button>
                  </div>
                );
              }) : null}
              {selectedProjectContexts.map((projectId) => {
                const project = vaultState.projects.blocks.find((block) => block.id === projectId);
                if (!project) return null;
                return <div className="agent-context-item" key={`project-${projectId}`}><span>Project: {project.title}</span><button type="button" aria-label={`Remove ${project.title} project context`} onClick={() => setSelectedProjectContexts((ids) => ids.filter((id) => id !== projectId))}>×</button></div>;
              })}
              {selectedAgentContexts.length === 0 && selectedProjectContexts.length === 0 && <p className="agent-context-empty">No workspace context selected.</p>}
              {!selectedAgentContexts.includes(activePage) && (
                <button type="button" className="agent-add-context" onClick={() => setSelectedAgentContexts((items) => [...items, activePage])}>+ Add {activeNavItem.label}</button>
              )}
            </div>
          )}
          <form className="agent-form" onSubmit={askAssistant}>
            <button
              type="button"
              className={`agent-context-trigger ${selectedAgentContexts.length + selectedProjectContexts.length ? "active" : ""}`}
              onClick={() => setIsAgentContextOpen((open) => !open)}
              aria-expanded={isAgentContextOpen}
            >
              Context{selectedAgentContexts.length + selectedProjectContexts.length ? ` ${selectedAgentContexts.length + selectedProjectContexts.length}` : ""}
            </button>
            <textarea
              value={assistantQuestion}
              onChange={(event) => setAssistantQuestion(event.target.value)}
              placeholder="Message IO Assistant..."
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button className="agent-send" type="submit" disabled={isAssistantLoading || !assistantQuestion.trim()} aria-label="Send message">↑</button>
          </form>
        </div>
      </aside>
    </>
  );

  // --- Auth gate: verify session, then require sign-in before the app ---

  if (!isAuthReady || (authUser && isWorkspaceLoading)) {
    return (
      <main className="home-screen" aria-label="Loading IO Vault">
        <div className="grid-overlay" />
        <section className="title-wrap">
          <p className="kicker">IO Vault</p>
          <h1>Loading…</h1>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuthed={handleAuthed} />;
  }

  // --- Unlock / landing screen (animated hero before entering the workspace) ---

  if (!isUnlocked) {
    return (
      <>
        <main className={`home-screen theme-${vaultState.settings.theme.mode}`} aria-label="IO Vault home screen" style={themeStyle}>
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="orb orb-three" />
          <div className="grid-overlay" />
          <section className="title-wrap">
            <p className="kicker">Welcome to</p>
            <h1>IO Vault</h1>
            <button className="unlock-button" type="button" onClick={() => setIsUnlocked(true)}>
              Unlock
            </button>
            <button className="auth-switch" type="button" onClick={signOut} disabled={isSigningOut}>
              {isSigningOut ? "Saving before sign out…" : `Sign out (${authUser.email})`}
            </button>
            {syncState === "error" && <p role="alert">Could not save changes. Retry sign out.</p>}
            {syncState === "local-only" && <p role="alert">Workspace is too large for cloud sync. It remains local only.</p>}
            {syncState === "unsynced" && <p role="alert">Local changes are protected but not in the cloud. Retry when connected.</p>}
            {syncState === "cache-error" && <p role="alert">Browser storage failed. Manually copy important content, free browser storage without clearing IO Vault site data, then retry.</p>}
          </section>
        </main>
        {agentDrawer}
      </>
    );
  }

  // --- Main workspace: sidebar navigation + page content ---

  return (
    <>
      <main className={`vault-dashboard nav-${isNavOpen ? "open" : "closed"} theme-${vaultState.settings.theme.mode}`} style={themeStyle}>
        {/* Left nav: switch between Code, Learning, Career, Projects */}
        <aside className={`workspace-nav ${isNavOpen ? "open" : ""}`}>
          <button className="nav-toggle" type="button" onClick={() => setIsNavOpen((value) => !value)}>
            {isNavOpen ? "Close" : "Menu"}
          </button>
          {navItems.map((item) => {
            const iconId = vaultState.settings.navIcons[item.key];
            const Icon = (iconId && ICONS_BY_ID[iconId]) || item.defaultIcon;

            return (
              <button
                className={activePage === item.key ? "active" : ""}
                key={item.key}
                type="button"
                onClick={() => setActivePage(item.key)}
                aria-label={item.label}
              >
                <span>
                  <Icon aria-hidden="true" />
                </span>
                <strong>{item.label}</strong>
              </button>
            );
          })}

          {isNavOpen && (
            <div className="nav-icon-settings" aria-label="Navigation icon settings">
              <p className="kicker">Icons</p>
              {navItems.map((item) => {
                const currentId = vaultState.settings.navIcons[item.key];
                const CurrentIcon = (currentId && ICONS_BY_ID[currentId]) || item.defaultIcon;

                return (
                  <label className="nav-icon-row" key={`icon-${item.key}`}>
                    <span className="nav-icon-preview" aria-hidden="true">
                      <CurrentIcon />
                    </span>
                    <span className="nav-icon-label">{item.label}</span>
                    <select
                      value={currentId}
                      onChange={(event) => setNavIcon(item.key, event.target.value as IconId)}
                      aria-label={`${item.label} icon`}
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          )}
        </aside>

        <section className="workspace-shell">
          <header className="workspace-topline">
            <button className="brand" type="button" onClick={() => setIsUnlocked(false)}>
              IO Vault
            </button>
            <div>
              <p className="kicker title-icon">
                <ActivePageIcon aria-hidden="true" />
              </p>
              <h1>{activeNavItem.label}</h1>
            </div>
            <div className="account-box">
              <span className={`sync-pill sync-${syncState}`} title="Server sync status">{syncLabel}</span>
              <span className="account-email">{authUser.email}</span>
              <button className="sign-out" type="button" onClick={signOut} disabled={isSigningOut}>
                {isSigningOut ? "Saving…" : "Sign out"}
              </button>
              {signOutProtectionMessage && <p role="alert">{signOutProtectionMessage}</p>}
            </div>
          </header>

          {/* Page: Code Vault — GitHub-backed browser IDE + scratch snippets */}
          {activePage === "code" && (
            <CodeVaultWorkspace
              code={vaultState.code}
              githubSuggestion={vaultState.github.repo}
              updateCode={updateCode}
            />
          )}

          {/* Page: Write — structured notes, collections, and explicit AI context */}
          {activePage === "write" && (
            <NotesWorkspace
              write={vaultState.write}
              onChange={(write) => updateWrite(write)}
              includeAssistantContext={selectedAgentContexts.includes("write")}
              onAssistantContextChange={(included) => setSelectedAgentContexts((items) => included
                ? [...new Set([...items, "write" as PageKey])]
                : items.filter((page) => page !== "write"))}
            />
          )}

          {activePage === "settings" && (
            <section className="settings-workspace" aria-label="Theme settings">
              <header className="settings-intro">
                <p className="kicker">Appearance</p>
                <h2>Theme Mode</h2>
                <p>Tune the color atmosphere while preserving IO Vault’s motion, depth, and interface design.</p>
              </header>
              <div className="theme-studio editor-panel">
                <div className="theme-preview" aria-hidden="true"><span /><span /><span /></div>
                <div className="theme-controls">
                  <label><span><strong>Accent shade</strong><small>{vaultState.settings.theme.hue}°</small></span><input aria-label="Theme accent shade" type="range" min="0" max="360" value={vaultState.settings.theme.hue} onChange={(event) => updateSettings({ theme: { ...vaultState.settings.theme, hue: Number(event.target.value) } })} /></label>
                  <label><span><strong>Ambient glow</strong><small>{vaultState.settings.theme.glow}%</small></span><input aria-label="Theme ambient glow" type="range" min="20" max="100" value={vaultState.settings.theme.glow} onChange={(event) => updateSettings({ theme: { ...vaultState.settings.theme, glow: Number(event.target.value) } })} /></label>
                  <label><span><strong>Surface depth</strong><small>{vaultState.settings.theme.depth}%</small></span><input aria-label="Theme surface depth" type="range" min="0" max="20" value={vaultState.settings.theme.depth} onChange={(event) => updateSettings({ theme: { ...vaultState.settings.theme, depth: Number(event.target.value) } })} /></label>
                  <div className="theme-presets" role="group" aria-label="Theme presets">{[
                    { name: "IO Blue", theme: { mode: "default" as const, hue: 198, glow: 55, depth: 8 } },
                    { name: "Dark", theme: { mode: "tinted" as const, hue: 210, glow: 28, depth: 2 } },
                    { name: "Night", theme: { mode: "night" as const, hue: vaultState.settings.theme.hue, glow: 24, depth: 0 } },
                    { name: "Light", theme: { mode: "light" as const, hue: vaultState.settings.theme.hue, glow: 42, depth: 4 } },
                    { name: "Violet", theme: { ...vaultState.settings.theme, mode: "tinted" as const, hue: 265 } },
                    { name: "Aurora", theme: { ...vaultState.settings.theme, mode: "tinted" as const, hue: 155 } },
                    { name: "Solar", theme: { ...vaultState.settings.theme, mode: "tinted" as const, hue: 32 } },
                    { name: "Rose", theme: { ...vaultState.settings.theme, mode: "tinted" as const, hue: 335 } },
                  ].map((preset) => <button type="button" key={preset.name} className={vaultState.settings.theme.mode === preset.theme.mode && vaultState.settings.theme.hue === preset.theme.hue && vaultState.settings.theme.glow === preset.theme.glow && vaultState.settings.theme.depth === preset.theme.depth ? "active" : ""} onClick={() => updateSettings({ theme: preset.theme })}><span style={{ background: preset.name === "Night" ? "#000" : preset.name === "Light" ? "#fff" : preset.name === "Dark" ? "#07101d" : `hsl(${preset.theme.hue} 82% 58%)` }} />{preset.name}</button>)}</div>
                  <button className="theme-reset" type="button" onClick={() => updateSettings({ theme: { ...defaultVaultState.settings.theme } })}><span aria-hidden="true">↺</span>Default <small>IO Blue</small></button>
                </div>
              </div>
            </section>
          )}

          {/* Page: Learning — durable Mentor agent */}
          {activePage === "learning" && (
            <AgentWorkspace agent="learning" legacyData={vaultState.learning} onLegacyMigrated={() => saveVaultState((previous) => ({...previous,learning:{docHtml:"",connections:[],calendarFocus:[]}}))}/>
          )}

          {/* Page: Career — durable Career agent */}
          {activePage === "career" && (
            <AgentWorkspace agent="career" legacyData={vaultState.career} onLegacyMigrated={() => saveVaultState((previous) => ({...previous,career:{resume:"",aiDraft:""}}))}/>
          )}

          {/* Page: Projects — kanban-style blocks with status and notes */}
          {activePage === "projects" && (
            <div className="projects-workspace">
              <div className="project-toolbar">
                <div className="project-filters" role="group" aria-label="Filter projects">
                  <button type="button" className={projectFilter === "all" ? "active" : ""} onClick={() => setProjectFilter("all")}>All {projectStats.total}</button>
                  <button type="button" className={projectFilter === "active" ? "active" : ""} onClick={() => setProjectFilter("active")}>Active {projectStats.active}</button>
                  <button type="button" className={projectFilter === "progress" ? "active" : ""} onClick={() => setProjectFilter("progress")}>In Progress {projectStats.progress}</button>
                  <button type="button" className={projectFilter === "done" ? "active" : ""} onClick={() => setProjectFilter("done")}>Done {projectStats.done}</button>
                </div>
                <div className="project-create-wrap">
                  <button type="button" onClick={() => addProjectBlock()}>New Project</button>
                  <button type="button" className="project-board-menu-trigger" aria-label="Project organization and templates" aria-expanded={isProjectBoardMenuOpen} onClick={() => setIsProjectBoardMenuOpen((open) => !open)}>⌄</button>
                  {isProjectBoardMenuOpen && <div className="project-board-menu" role="menu" aria-label="Project organization and templates">
                    <strong>Organize</strong>
                    <button type="button" role="menuitem" onClick={() => sortProjects("title")}>Sort A–Z</button>
                    <button type="button" role="menuitem" onClick={() => sortProjects("status")}>Group by status</button>
                    <strong>Templates</strong>
                    <button type="button" role="menuitem" onClick={() => addProjectBlock("research")}>Research project</button>
                    <button type="button" role="menuitem" onClick={() => addProjectBlock("launch")}>Launch plan</button>
                  </div>}
                </div>
              </div>

              <section className="project-board">
                {filteredProjects.map((block) => (
                  <article className={`project-block ${draggedProjectId === block.id ? "dragging" : ""} ${projectDropTarget?.id === block.id ? `drop-${projectDropTarget.position}` : ""}`} key={block.id} draggable onDragStart={() => setDraggedProjectId(block.id)} onDragEnd={() => { setDraggedProjectId(null); setProjectDropTarget(null); }} onDragOver={(event) => { if (!draggedProjectId || draggedProjectId === block.id) return; event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); setProjectDropTarget({ id: block.id, position: event.clientY < bounds.top + bounds.height / 2 ? "before" : "after" }); }} onDrop={(event) => { event.preventDefault(); if (draggedProjectId) reorderProject(draggedProjectId, block.id, projectDropTarget?.id === block.id ? projectDropTarget.position : "after"); }}>
                    <div className="project-block-head">
                      <input
                        value={block.title}
                        onChange={(event) => updateProject(block.id, { title: event.target.value })}
                        aria-label={`${block.title} title`}
                      />
                      <button
                        className="project-open-page"
                        type="button"
                        onClick={() => {
                          setProjectDocMode("rich");
                          setIsMarkdownPreview(false);
                          setOpenProjectId(block.id);
                        }}
                        aria-label={`Open ${block.title} as a full page`}
                        title="Open as full page"
                      >
                        <HiOutlineArrowsPointingOut aria-hidden="true" />
                      </button>
                      <div className="project-actions-wrap" onPointerDown={(event) => event.stopPropagation()}><button type="button" className="project-card-action" aria-label={`Project actions for ${block.title}`} aria-haspopup="menu" aria-expanded={projectMenuId === block.id} onClick={() => setProjectMenuId((current) => current === block.id ? null : block.id)}>•••</button>{projectMenuId === block.id && <div className="project-actions-menu" role="menu" aria-label={`Actions for ${block.title}`}><button type="button" role="menuitem" onClick={() => sendProjectToAssistant(block)}>Send to AI</button><button type="button" role="menuitem" onClick={() => openProjectMode(block, "table")}>{block.table ? "Open table" : "Add table"}</button><button type="button" role="menuitem" onClick={() => openProjectMode(block, "flowchart")}>{block.flowchart ? "Open flowchart" : "Add flowchart"}</button><button type="button" role="menuitem" onClick={() => openProjectMode(block, "mindmap")}>{block.mindmap ? "Open object mindmap" : "Add object mindmap"}</button><button type="button" role="menuitem" className="project-delete" onClick={() => { setProjectMenuId(null); deleteProject(block.id); }}>Delete project</button></div>}</div>
                    </div>
                    <select
                      value={block.status}
                      onChange={(event) => updateProject(block.id, { status: event.target.value as ProjectStatus })}
                      aria-label={`${block.title} status`}
                    >
                      <option value="Active">Active</option>
                      <option value="In progress">In progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <div className="project-card-preview" aria-label={`${block.title} preview`}>
                      {block.docHtml?.trim() && <div className="project-card-rich-preview">{agentPlainText(block.docHtml.replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, "$&\n")).trim()}</div>}
                      {block.docMarkdown?.trim() && <div className="project-card-markdown-preview"><ReactMarkdown>{block.docMarkdown}</ReactMarkdown></div>}
                      {!block.docHtml?.trim() && !block.docMarkdown?.trim() && <p>{block.body || "Open this project to add content."}</p>}
                    </div>
                  </article>
                ))}
              </section>

              {openProject && (
                <div
                  className="project-page-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${openProject.title} page`}
                  onPointerDown={(event) => { if (event.target === event.currentTarget) setOpenProjectId(null); }}
                >
                  <div className="project-page" onPointerDown={(event) => event.stopPropagation()}>
                    <header className="project-page-head">
                      <button
                        className="project-page-back"
                        type="button"
                        onClick={() => setOpenProjectId(null)}
                      >
                        Back
                      </button>
                      <input
                        className="project-page-title"
                        value={openProject.title}
                        onChange={(event) => updateProject(openProject.id, { title: event.target.value })}
                        aria-label="Project title"
                      />
                      <select
                        value={openProject.status}
                        onChange={(event) =>
                          updateProject(openProject.id, { status: event.target.value as ProjectStatus })
                        }
                        aria-label="Project status"
                      >
                        <option value="Active">Active</option>
                        <option value="In progress">In progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </header>

                    <div className="project-page-toolbar" role="toolbar" aria-label="Document tools">
                      <div className="project-page-modes" role="group" aria-label="Editor mode">
                        <button
                          type="button"
                          aria-pressed={projectDocMode === "rich"}
                          className={projectDocMode === "rich" ? "active" : ""}
                          onClick={() => {
                            setProjectDocMode("rich");
                            setIsMarkdownPreview(false);
                          }}
                        >
                          Rich Text
                        </button>
                        <button
                          type="button"
                          aria-pressed={projectDocMode === "markdown"}
                          className={projectDocMode === "markdown" ? "active" : ""}
                          onClick={() => {
                            setProjectDocMode("markdown");
                            setIsMarkdownPreview(false);
                          }}
                        >
                          Markdown
                        </button>
                        {openProject.table && <button type="button" aria-pressed={projectDocMode === "table"} className={projectDocMode === "table" ? "active" : ""} onClick={() => setProjectDocMode("table")}>Table</button>}
                        {openProject.flowchart && <button type="button" aria-pressed={projectDocMode === "flowchart"} className={projectDocMode === "flowchart" ? "active" : ""} onClick={() => setProjectDocMode("flowchart")}>Flowchart</button>}
                        {openProject.mindmap && <button type="button" aria-pressed={projectDocMode === "mindmap"} className={projectDocMode === "mindmap" ? "active" : ""} onClick={() => setProjectDocMode("mindmap")}>Mindmap</button>}
                      </div>

                      <span className="project-page-toolbar-divider" aria-hidden="true" />

                      {projectDocMode === "rich" ? (
                        <div className="project-page-format">
                          <TextFormatMenu onCommand={applyWriteFormat} />
                        </div>
                      ) : projectDocMode === "markdown" ? (
                        <>
                          <div className="project-page-format">
                            <button type="button" disabled={isMarkdownPreview} onClick={() => wrapProjectMarkdown("**", "**")} aria-label="Bold">B</button>
                            <button type="button" disabled={isMarkdownPreview} onClick={() => wrapProjectMarkdown("_", "_")} aria-label="Italic">I</button>
                            <button type="button" disabled={isMarkdownPreview} onClick={() => wrapProjectMarkdown("## ", "")} aria-label="Heading">H</button>
                            <button type="button" disabled={isMarkdownPreview} onClick={() => wrapProjectMarkdown("- ", "")} aria-label="Bullet list">•</button>
                            <button type="button" disabled={isMarkdownPreview} onClick={() => wrapProjectMarkdown("`", "`")} aria-label="Inline code">{"</>"}</button>
                          </div>
                          <button
                            type="button"
                            className={`project-md-toggle ${isMarkdownPreview ? "active" : ""}`}
                            aria-pressed={isMarkdownPreview}
                            onClick={() => setIsMarkdownPreview((value) => !value)}
                          >
                            {isMarkdownPreview ? "Edit" : "Preview"}
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className="project-page-body">
                      {projectDocMode === "rich" ? (
                        <RichTextEditor
                          key={`project-rich-${openProject.id}`}
                          className="rich-editor project-page-editor"
                          html={openProject.docHtml ?? ""}
                          onChange={(docHtml) => updateProject(openProject.id, { docHtml })}
                          role="textbox"
                          ariaMultiline
                          ariaLabel="Project rich text document"
                        />
                      ) : projectDocMode === "markdown" && isMarkdownPreview ? (
                        <div className="project-md-preview" aria-label="Markdown preview">
                          {openProject.docMarkdown?.trim() ? (
                            <ReactMarkdown>{openProject.docMarkdown}</ReactMarkdown>
                          ) : (
                            <p className="project-md-empty">Nothing to preview yet — switch to Edit and start writing.</p>
                          )}
                        </div>
                      ) : projectDocMode === "markdown" ? (
                        <textarea
                          ref={markdownRef}
                          className="project-md-input"
                          value={openProject.docMarkdown ?? ""}
                          onChange={(event) => updateProject(openProject.id, { docMarkdown: event.target.value })}
                          placeholder="Write Markdown here, then use Preview to render it."
                          aria-label="Project markdown"
                          spellCheck={false}
                        />
                      ) : projectDocMode === "table" && openProject.table ? <ProjectTableEditor table={openProject.table} onChange={(table) => updateProject(openProject.id, { table })} /> : projectDocMode === "flowchart" && openProject.flowchart ? <ProjectFlowchartEditor flowchart={openProject.flowchart} onChange={(flowchart) => updateProject(openProject.id, { flowchart })} /> : projectDocMode === "mindmap" && openProject.mindmap ? <ProjectMindmapEditor mindmap={openProject.mindmap} onChange={(mindmap) => updateProject(openProject.id, { mindmap })} /> : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      {agentDrawer}
    </>
  );
}

export default App;
