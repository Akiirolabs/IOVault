/**
 * IO Vault — main application UI.
 *
 * Flow: unlock screen → dashboard with workspace pages (Code, Write, Learning, Career, Projects).
 * All workspace data persists to localStorage. AI features call POST /api/agent (see server/index.js).
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { IconType } from "react-icons";
import { FaLinkedin } from "react-icons/fa";
import {
  HiOutlineAcademicCap,
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
import { AI_MODEL } from "./aiConfig";

// --- Types: shape of each workspace page and full saved state ---

type PageKey = "code" | "write" | "learning" | "career" | "projects";
type Status = "Planned" | "In progress" | "Done";

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

type CodeSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
};

type LearningConnection = {
  name: string;
  status: string;
  progress: number;
};

type ProjectBlock = {
  id: string;
  title: string;
  status: Status;
  body: string;
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

type VaultState = {
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
  write: {
    docHtml: string;
  };
  github: {
    repo: string;
  };
  settings: {
    navIcons: Record<PageKey, IconId>;
  };
};

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
];

/** localStorage key — entire VaultState is JSON-serialized here on every edit */
const storageKey = "io-vault-workspace";

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
  write: {
    docHtml: "",
  },
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
    },
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
        status: "Planned",
        body: "Collect sources, observations, experiment notes, and decisions.",
      },
    ],
  },
};

// --- Persistence: read/write localStorage safely ---

/** Merges saved JSON with defaults so partial or legacy data never crashes the app */
function normalizeVaultState(raw: unknown): VaultState {
  if (!raw || typeof raw !== "object") return defaultVaultState;

  const parsed = raw as Partial<VaultState>;

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
    write: {
      ...defaultVaultState.write,
      ...(typeof parsed.write === "object" && parsed.write ? parsed.write : {}),
    },
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
    },
    projects: {
      blocks: Array.isArray(parsed.projects?.blocks)
        ? parsed.projects.blocks
        : defaultVaultState.projects.blocks,
    },
  };
}

/** Loads workspace from localStorage, or returns defaults if empty / corrupt */
function getSavedVaultState() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) return defaultVaultState;

  try {
    return normalizeVaultState(JSON.parse(saved));
  } catch {
    localStorage.removeItem(storageKey);
    return defaultVaultState;
  }
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

function App() {
  // --- UI state (not persisted): which screen/panels are open ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("code");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isLearningPanelOpen, setIsLearningPanelOpen] = useState(false);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>("snippet-1");
  const [vaultState, setVaultState] = useState<VaultState>(getSavedVaultState);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("Ask the agent anything or have it search this workspace.");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [githubStatus, setGithubStatus] = useState<GithubTestStatus | null>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  // --- Derived values for the active page / snippet / project counts ---
  const activeSnippet = vaultState.code.snippets.find((snippet) => snippet.id === activeSnippetId);
  const activeNavItem = navItems.find((item) => item.key === activePage) || navItems[0];
  const activeNavIconId = vaultState.settings.navIcons[activeNavItem.key];
  const ActivePageIcon = (activeNavIconId && ICONS_BY_ID[activeNavIconId]) || activeNavItem.defaultIcon;
  const projectStats = useMemo(() => {
    const active = vaultState.projects.blocks.filter((block) => block.status === "In progress").length;
    const done = vaultState.projects.blocks.filter((block) => block.status === "Done").length;
    return { active, done, total: vaultState.projects.blocks.length };
  }, [vaultState.projects.blocks]);

  // --- State updaters: every change writes through to localStorage ---

  function saveVaultState(reducer: (previous: VaultState) => VaultState) {
    setVaultState((previous) => {
      const nextState = reducer(previous);
      localStorage.setItem(storageKey, JSON.stringify(nextState));
      return nextState;
    });
  }

  function updateCode(updates: Partial<VaultState["code"]>) {
    saveVaultState((prev) => ({ ...prev, code: { ...prev.code, ...updates } }));
  }

  function updateLearning(updates: Partial<VaultState["learning"]>) {
    saveVaultState((prev) => ({ ...prev, learning: { ...prev.learning, ...updates } }));
  }

  function updateWrite(updates: Partial<VaultState["write"]>) {
    saveVaultState((prev) => ({ ...prev, write: { ...prev.write, ...updates } }));
  }

  function updateGithub(updates: Partial<VaultState["github"]>) {
    saveVaultState((prev) => ({ ...prev, github: { ...prev.github, ...updates } }));
  }

  function updateCalendarFocus(index: number) {
    const current = vaultState.learning.calendarFocus[index] ?? "";
    const next = window.prompt(`Focus for Day ${index + 1}`, current);

    if (next === null) return;

    const trimmed = next.trim();
    if (!trimmed) return;

    updateLearning({
      calendarFocus: vaultState.learning.calendarFocus.map((value, position) =>
        position === index ? trimmed : value,
      ),
    });
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

  function updateCareer(updates: Partial<VaultState["career"]>) {
    saveVaultState((prev) => ({ ...prev, career: { ...prev.career, ...updates } }));
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

  function addProjectBlock() {
    const block: ProjectBlock = {
      id: crypto.randomUUID(),
      title: "Untitled Project",
      status: "Planned",
      body: "Write project context, notes, links, and next steps.",
    };

    saveVaultState((prev) => ({
      ...prev,
      projects: { ...prev.projects, blocks: [block, ...prev.projects.blocks] },
    }));
  }

  // --- AI: shared fetch to /api/agent (proxied to Express in dev) ---

  async function requestAgent(message: string) {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, vaultData: vaultState }),
    });
    const data = (await response.json()) as { answer?: string; error?: string };

    if (!response.ok) throw new Error(data.error || "AI request failed.");
    return data.answer || "I could not generate an answer.";
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = assistantQuestion.trim();

    if (!prompt) {
      setAssistantAnswer("Ask a question, request a summary, or search the workspace.");
      return;
    }

    setIsAssistantLoading(true);

    try {
      setAssistantAnswer(await requestAgent(prompt));
    } catch (error) {
      const fallback = answerBasicQuestion(prompt.toLowerCase());
      setAssistantAnswer(
        fallback || `${error instanceof Error ? error.message : "AI request failed."} Local fallback did not find an answer.`,
      );
    } finally {
      setIsAssistantLoading(false);
    }
  }

  async function reviseResume() {
    setIsResumeLoading(true);

    try {
      const answer = await requestAgent(
        `Revise this resume for clarity, impact, ATS readability, and strong bullets. Return only the improved resume text:\n\n${vaultState.career.resume}`,
      );
      updateCareer({ aiDraft: answer });
    } catch (error) {
      updateCareer({
        aiDraft: error instanceof Error ? error.message : "Could not revise the resume right now.",
      });
    } finally {
      setIsResumeLoading(false);
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
          <button type="button" onClick={() => setIsAgentOpen(false)} aria-label="Close agent">
            Close
          </button>
        </div>

        <p className="agent-status">{AI_MODEL}</p>

        <form className="agent-form" onSubmit={askAssistant}>
          <textarea
            value={assistantQuestion}
            onChange={(event) => setAssistantQuestion(event.target.value)}
            placeholder="Ask the agent to write, explain, revise, plan, or find..."
          />
          <button type="submit" disabled={isAssistantLoading}>
            {isAssistantLoading ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        <div className="agent-response">
          <ReactMarkdown>{assistantAnswer}</ReactMarkdown>
        </div>
        <div className="agent-key-note">
          Model: <code>{AI_MODEL}</code>
        </div>
      </aside>
    </>
  );

  // --- Unlock / landing screen (animated hero before entering the workspace) ---

  if (!isUnlocked) {
    return (
      <>
        <main className="home-screen" aria-label="IO Vault home screen">
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
          </section>
        </main>
        {agentDrawer}
      </>
    );
  }

  // --- Main workspace: sidebar navigation + page content ---

  return (
    <>
      <main className={`vault-dashboard nav-${isNavOpen ? "open" : "closed"}`}>
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
          </header>

          {/* Page: Code Vault — editor, syntax preview, notes, saved snippets */}
          {activePage === "code" && (
            <div className="code-workspace page-grid">
              <section className="editor-panel code-editor-panel">
                <div className="panel-toolbar">
                  <select
                    value={vaultState.code.language}
                    onChange={(event) => updateCode({ language: event.target.value })}
                    aria-label="Code language"
                  >
                    <option value="tsx">TSX</option>
                    <option value="ts">TypeScript</option>
                    <option value="js">JavaScript</option>
                    <option value="py">Python</option>
                    <option value="css">CSS</option>
                  </select>
                  <button type="button" onClick={addSnippet}>Save Snippet</button>
                  <button type="button" onClick={() => setIsGithubOpen((value) => !value)}>
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGithubOpen(true);
                      checkGithubTests();
                    }}
                  >
                    Tests
                  </button>
                </div>
                <textarea
                  className="code-input"
                  value={vaultState.code.editor}
                  onChange={(event) => updateCode({ editor: event.target.value })}
                  spellCheck={false}
                  aria-label="Code editor"
                />
              </section>

              <section className="editor-panel syntax-panel">
                <div className="panel-label">Syntax Preview</div>
                <pre><code dangerouslySetInnerHTML={{ __html: highlightCode(vaultState.code.editor) }} /></pre>
              </section>

              <section className="editor-panel rich-panel">
                <div className="panel-label">Notes</div>
                <RichTextEditor
                  className="rich-editor"
                  html={vaultState.code.notesHtml}
                  onChange={(notesHtml) => updateCode({ notesHtml })}
                />
              </section>

              <aside className="snippet-strip">
                {vaultState.code.snippets.map((snippet) => (
                  <button
                    className={activeSnippetId === snippet.id ? "snippet-card active" : "snippet-card"}
                    key={snippet.id}
                    type="button"
                    onClick={() => setActiveSnippetId(snippet.id)}
                  >
                    <strong>{snippet.title}</strong>
                    <span>{snippet.language}</span>
                  </button>
                ))}
              </aside>

              {activeSnippet && (
                <div className="floating-snippet">
                  <div className="panel-toolbar">
                    <strong>{activeSnippet.title}</strong>
                    <button type="button" onClick={() => updateCode({ editor: activeSnippet.code, language: activeSnippet.language })}>
                      Open
                    </button>
                    <button type="button" onClick={() => setActiveSnippetId(null)}>Hide</button>
                  </div>
                  <pre><code dangerouslySetInnerHTML={{ __html: highlightCode(activeSnippet.code) }} /></pre>
                </div>
              )}

              {isGithubOpen && (
                <div className="github-card">
                  <div className="panel-toolbar">
                    <strong>GitHub Test Status</strong>
                    <button type="button" onClick={() => setIsGithubOpen(false)}>Hide</button>
                  </div>
                  <div className="github-card-body">
                    <input
                      value={vaultState.github.repo}
                      onChange={(event) => updateGithub({ repo: event.target.value })}
                      placeholder="owner/repository"
                      aria-label="GitHub repository"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") checkGithubTests();
                      }}
                    />
                    <button type="button" onClick={checkGithubTests} disabled={isGithubLoading}>
                      {isGithubLoading ? "Checking..." : "Check tests"}
                    </button>

                    {githubStatus && (
                      <div className={`github-result ${githubStatus.state}`}>
                        <p>{githubStatus.message}</p>
                        {githubStatus.run && (
                          <ul>
                            <li><span>Workflow</span><strong>{githubStatus.run.name}</strong></li>
                            <li><span>Status</span><strong>{githubStatus.run.status}</strong></li>
                            <li><span>Result</span><strong>{githubStatus.run.conclusion ?? "pending"}</strong></li>
                            <li><span>Branch</span><strong>{githubStatus.run.branch}</strong></li>
                            <li><span>Commit</span><strong>{githubStatus.run.commit}</strong></li>
                            <li><span>Updated</span><strong>{githubStatus.run.updatedAt}</strong></li>
                            <li>
                              <a href={githubStatus.run.url} target="_blank" rel="noreferrer">
                                View on GitHub
                              </a>
                            </li>
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Page: Write — blank rich-text canvas (no labels or starter copy) */}
          {activePage === "write" && (
            <div className="write-workspace">
              <section className="editor-panel write-panel">
                <div className="write-format-bar" role="toolbar" aria-label="Text formatting">
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyWriteFormat("bold");
                    }}
                    aria-label="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyWriteFormat("italic");
                    }}
                    aria-label="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyWriteFormat("underline");
                    }}
                    aria-label="Underline"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyWriteFormat("formatBlock", "h2");
                    }}
                    aria-label="Heading"
                  >
                    H
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyWriteFormat("insertUnorderedList");
                    }}
                    aria-label="Bullet list"
                  >
                    •
                  </button>
                </div>
                <RichTextEditor
                  className="rich-editor write-canvas"
                  html={vaultState.write.docHtml}
                  onChange={(docHtml) => updateWrite({ docHtml })}
                  role="textbox"
                  ariaMultiline
                  ariaLabel="Write"
                />
              </section>
            </div>
          )}

          {/* Page: Learning — docs, course connections drawer, focus calendar */}
          {activePage === "learning" && (
            <div className="learning-workspace page-grid">
              <button
                className="learning-pull-button"
                type="button"
                onClick={() => setIsLearningPanelOpen((value) => !value)}
              >
                Learning APIs
              </button>

              <aside className={`learning-drawer ${isLearningPanelOpen ? "open" : ""}`}>
                <p className="kicker">Connections</p>
                {vaultState.learning.connections.map((connection) => (
                  <div className="connection-card" key={connection.name}>
                    <strong>{connection.name}</strong>
                    <span>{connection.status}</span>
                    <div><i style={{ width: `${connection.progress}%` }} /></div>
                  </div>
                ))}
              </aside>

              <section className="editor-panel documentation-panel">
                <div className="panel-label">Documentation Notes</div>
                <RichTextEditor
                  className="rich-editor document-space"
                  html={vaultState.learning.docHtml}
                  onChange={(docHtml) => updateLearning({ docHtml })}
                />
              </section>

              <section className="editor-panel calendar-panel">
                <div className="panel-label">Mini Calendar</div>
                <div className="calendar-grid">
                  {vaultState.learning.calendarFocus.map((day, index) => (
                    <button
                      key={`${day}-${index}`}
                      type="button"
                      onClick={() => updateCalendarFocus(index)}
                      title="Click to edit this day's focus"
                    >
                      <span>Day {index + 1}</span>
                      <strong>{day}</strong>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Page: Career — resume editor + AI revision draft */}
          {activePage === "career" && (
            <div className="career-workspace page-grid two-column">
              <section className="editor-panel resume-panel">
                <div className="panel-toolbar">
                  <span>Resume Editor</span>
                  <button type="button" onClick={reviseResume} disabled={isResumeLoading}>
                    {isResumeLoading ? "Revising..." : "AI Revise"}
                  </button>
                </div>
                <textarea
                  className="resume-editor"
                  value={vaultState.career.resume}
                  onChange={(event) => updateCareer({ resume: event.target.value })}
                  aria-label="Resume editor"
                />
              </section>

              <section className="editor-panel resume-panel">
                <div className="panel-toolbar">
                  <span>AI Draft</span>
                  <button type="button" onClick={() => updateCareer({ resume: vaultState.career.aiDraft })}>
                    Apply
                  </button>
                </div>
                <textarea
                  className="resume-editor"
                  value={vaultState.career.aiDraft}
                  onChange={(event) => updateCareer({ aiDraft: event.target.value })}
                  aria-label="AI resume draft"
                />
              </section>
            </div>
          )}

          {/* Page: Projects — kanban-style blocks with status and notes */}
          {activePage === "projects" && (
            <div className="projects-workspace">
              <div className="project-toolbar">
                <div>
                  <span>{projectStats.active} active</span>
                  <span>{projectStats.done} done</span>
                  <span>{projectStats.total} total</span>
                </div>
                <button type="button" onClick={addProjectBlock}>New Block</button>
              </div>

              <section className="project-board">
                {vaultState.projects.blocks.map((block) => (
                  <article className="project-block" key={block.id}>
                    <input
                      value={block.title}
                      onChange={(event) => updateProject(block.id, { title: event.target.value })}
                      aria-label={`${block.title} title`}
                    />
                    <select
                      value={block.status}
                      onChange={(event) => updateProject(block.id, { status: event.target.value as Status })}
                      aria-label={`${block.title} status`}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In progress">In progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <textarea
                      value={block.body}
                      onChange={(event) => updateProject(block.id, { body: event.target.value })}
                      aria-label={`${block.title} notes`}
                    />
                  </article>
                ))}
              </section>
            </div>
          )}
        </section>
      </main>
      {agentDrawer}
    </>
  );
}

export default App;
