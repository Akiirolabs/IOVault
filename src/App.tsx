/**
 * IO Vault — main application UI.
 *
 * Flow: unlock screen → dashboard with 4 workspace pages (Code, Learning, Career, Projects).
 * All workspace data persists to localStorage. AI features call POST /api/agent (see server/index.js).
 */
import { FormEvent, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { FaLinkedin } from "react-icons/fa";
import { SiCoursera, SiGithub, SiNotion } from "react-icons/si";
import { AI_MODEL } from "./aiConfig";

// --- Types: shape of each workspace page and full saved state ---

type PageKey = "code" | "learning" | "career" | "projects";
type Status = "Planned" | "In progress" | "Done";

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
};

type NavItem = {
  key: PageKey;
  label: string;
  icon: IconType;
};

// --- Navigation & defaults: sidebar labels and first-run sample content ---

const navItems: NavItem[] = [
  { key: "code", label: "Code Vault", icon: SiGithub },
  { key: "learning", label: "Learning", icon: SiCoursera },
  { key: "career", label: "Career", icon: FaLinkedin },
  { key: "projects", label: "Projects", icon: SiNotion },
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

  // --- Derived values for the active page / snippet / project counts ---
  const activeSnippet = vaultState.code.snippets.find((snippet) => snippet.id === activeSnippetId);
  const activeNavItem = navItems.find((item) => item.key === activePage) || navItems[0];
  const ActivePageIcon = activeNavItem.icon;
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

        <div className="agent-response">{assistantAnswer}</div>
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
            const Icon = item.icon;

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
                  <button type="button">GitHub</button>
                  <button type="button">Tests</button>
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
                <div
                  className="rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(event) => updateCode({ notesHtml: event.currentTarget.innerHTML })}
                  dangerouslySetInnerHTML={{ __html: vaultState.code.notesHtml }}
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
                <div
                  className="rich-editor document-space"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(event) => updateLearning({ docHtml: event.currentTarget.innerHTML })}
                  dangerouslySetInnerHTML={{ __html: vaultState.learning.docHtml }}
                />
              </section>

              <section className="editor-panel calendar-panel">
                <div className="panel-label">Mini Calendar</div>
                <div className="calendar-grid">
                  {vaultState.learning.calendarFocus.map((day, index) => (
                    <button key={`${day}-${index}`} type="button">
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
