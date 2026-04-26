import { FormEvent, useMemo, useState } from "react";
import { AI_MODEL } from "./aiConfig";

type Status = "Planned" | "In progress" | "Done";

type VaultItem = {
  id: string;
  title: string;
  status: Status;
  note: string;
};

type VaultSection = {
  key: "code" | "learning" | "career" | "integrations";
  title: string;
  tab: string;
};

type TabKey = VaultSection["key"] | "assistant";

type VaultData = Record<VaultSection["key"], VaultItem[]>;

const sections: VaultSection[] = [
  { key: "code", title: "Code Vault", tab: "Code" },
  { key: "learning", title: "Learning Progress", tab: "Learning" },
  { key: "career", title: "Career Applications", tab: "Career" },
  { key: "integrations", title: "Integrations", tab: "Integrations" },
];

const defaultVaultData: VaultData = {
  code: [
    {
      id: "code-1",
      title: "IOVault GitHub repo",
      status: "In progress",
      note: "Track commits, test status, features, and deployment tasks.",
    },
    {
      id: "code-2",
      title: "Automated test checks",
      status: "Planned",
      note: "Connect GitHub Actions and show pass/fail status.",
    },
  ],
  learning: [
    {
      id: "learning-1",
      title: "Weekly focus",
      status: "In progress",
      note: "Pick one course and log progress.",
    },
    {
      id: "learning-2",
      title: "Practice log",
      status: "Planned",
      note: "Save reviews, blockers, and next steps.",
    },
  ],
  career: [
    {
      id: "career-1",
      title: "Application tracker",
      status: "In progress",
      note: "Company, role, date, contact, stage, follow-up.",
    },
    {
      id: "career-2",
      title: "Interview prep",
      status: "Planned",
      note: "Project stories, technical notes, and questions.",
    },
  ],
  integrations: [
    {
      id: "integrations-1",
      title: "AI assistant",
      status: "Planned",
      note: "Connect through a secure backend before using your API key.",
    },
    {
      id: "integrations-2",
      title: "GitHub Actions",
      status: "Planned",
      note: "Pull latest workflow results.",
    },
  ],
};

const storageKey = "io-vault-data";

function getSavedVaultData() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) return defaultVaultData;

  try {
    return JSON.parse(saved) as VaultData;
  } catch {
    localStorage.removeItem(storageKey);
    return defaultVaultData;
  }
}

function answerBasicQuestion(question: string) {
  if (/^(hi|hello|hey)\b/.test(question)) {
    return "Hey. I can help you search the vault, organize tasks, and answer basic questions.";
  }

  if (question.includes("who are you") || question.includes("what are you")) {
    return "I am the IO Vault assistant. I help keep your code, learning, career, and integrations organized.";
  }

  if (question.includes("what can you do") || question.includes("help")) {
    return "I can search your vault, remind you what needs attention, answer basic questions, and help organize next steps.";
  }

  if (question.includes("api key") || question.includes("key connected")) {
    return "The AI key is read by the local server from OPENAI_API_KEY in .env.local.";
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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("code");
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [vaultData, setVaultData] = useState<VaultData>(getSavedVaultData);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("Ask for a reminder or search your vault.");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const progress = useMemo(() => {
    const allItems = Object.values(vaultData).flat();
    const done = allItems.filter((item) => item.status === "Done").length;
    const active = allItems.filter((item) => item.status === "In progress").length;

    return {
      total: allItems.length,
      done,
      active,
      percent: allItems.length ? Math.round((done / allItems.length) * 100) : 0,
    };
  }, [vaultData]);

  const activeSection = sections.find((section) => section.key === activeTab);

  function saveVaultData(nextData: VaultData) {
    setVaultData(nextData);
    localStorage.setItem(storageKey, JSON.stringify(nextData));
  }

  function updateItem(
    sectionKey: VaultSection["key"],
    itemId: string,
    updates: Partial<VaultItem>,
  ) {
    saveVaultData({
      ...vaultData,
      [sectionKey]: vaultData[sectionKey].map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    });
  }

  function addItem(sectionKey: VaultSection["key"], event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!title) return;

    saveVaultData({
      ...vaultData,
      [sectionKey]: [
        ...vaultData[sectionKey],
        {
          id: `${sectionKey}-${crypto.randomUUID()}`,
          title,
          note: note || "Add notes, links, or next steps.",
          status: "Planned",
        },
      ],
    });

    event.currentTarget.reset();
  }

  function removeItem(sectionKey: VaultSection["key"], itemId: string) {
    saveVaultData({
      ...vaultData,
      [sectionKey]: vaultData[sectionKey].filter((item) => item.id !== itemId),
    });
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = assistantQuestion.trim();
    const question = prompt.toLowerCase();
    const allItems = sections.flatMap((section) =>
      vaultData[section.key].map((item) => ({ ...item, section: section.title })),
    );

    if (!question) {
      setAssistantAnswer("Ask: what needs attention? or search a project, course, company, or tool.");
      return;
    }

    const basicAnswer = answerBasicQuestion(question);

    if (basicAnswer) {
      setAssistantAnswer(basicAnswer);
      return;
    }

    let aiErrorMessage = "";
    setIsAssistantLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          vaultData,
        }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      setAssistantAnswer(data.answer || "I could not generate an answer.");
      return;
    } catch (error) {
      aiErrorMessage = error instanceof Error ? error.message : "AI request failed.";
    } finally {
      setIsAssistantLoading(false);
    }

    const needsAttention = allItems.filter((item) => item.status !== "Done");

    if (question.includes("remind") || question.includes("attention") || question.includes("todo")) {
      setAssistantAnswer(
        needsAttention.length
          ? `${aiErrorMessage ? `${aiErrorMessage} Local reminder: ` : ""}${needsAttention
              .slice(0, 4)
              .map((item) => `${item.title} - ${item.section}`)
              .join(" | ")}`
          : `${aiErrorMessage ? `${aiErrorMessage} ` : ""}Everything is marked done.`,
      );
      return;
    }

    const matches = allItems.filter((item) =>
      `${item.title} ${item.note} ${item.section}`.toLowerCase().includes(question),
    );

    setAssistantAnswer(
      matches.length
        ? `${aiErrorMessage ? `${aiErrorMessage} Local matches: ` : ""}${matches
            .slice(0, 5)
            .map((item) => `${item.title} - ${item.section}`)
            .join(" | ")}`
        : `${aiErrorMessage ? `${aiErrorMessage} ` : ""}No local match yet. Add it to a tab so I can track it.`,
    );
  }

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
            placeholder="Ask the agent to find, remind, or organize..."
          />
          <button type="submit" disabled={isAssistantLoading}>
            {isAssistantLoading ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        <div className="agent-response">{assistantAnswer}</div>

        <div className="agent-key-note">
          Key source: <code>OPENAI_API_KEY</code> in <code>.env.local</code>
        </div>
      </aside>
    </>
  );

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

  return (
    <>
      <main className="vault-dashboard">
        <header className="topbar">
          <button className="brand" type="button" onClick={() => setIsUnlocked(false)}>
            IO Vault
          </button>

        <nav className="tabs" aria-label="Vault sections">
          {sections.map((section) => (
            <button
              className={activeTab === section.key ? "active" : ""}
              key={section.key}
              type="button"
              onClick={() => setActiveTab(section.key)}
            >
              {section.tab}
            </button>
          ))}
          <button
            className={activeTab === "assistant" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("assistant")}
          >
            Assistant
          </button>
        </nav>

        <div className="mini-stats" aria-label="Vault progress">
          <strong>{progress.percent}%</strong>
          <span>{progress.active} active</span>
        </div>
      </header>

      {activeSection ? (
        <section className="workspace">
          <div className="workspace-head">
            <div>
              <p className="kicker">{activeSection.tab}</p>
              <h1>{activeSection.title}</h1>
            </div>
            <span>{vaultData[activeSection.key].length} items</span>
          </div>

          <div className="vault-items">
            {vaultData[activeSection.key].map((item) => (
              <article className="vault-item" key={item.id}>
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateItem(activeSection.key, item.id, { title: event.target.value })
                  }
                  aria-label={`${item.title} title`}
                />
                <textarea
                  value={item.note}
                  onChange={(event) =>
                    updateItem(activeSection.key, item.id, { note: event.target.value })
                  }
                  aria-label={`${item.title} notes`}
                />
                <div className="item-row">
                  <select
                    value={item.status}
                    onChange={(event) =>
                      updateItem(activeSection.key, item.id, { status: event.target.value as Status })
                    }
                    aria-label={`${item.title} status`}
                  >
                    <option>Planned</option>
                    <option>In progress</option>
                    <option>Done</option>
                  </select>
                  <button type="button" onClick={() => removeItem(activeSection.key, item.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <form className="add-item" onSubmit={(event) => addItem(activeSection.key, event)}>
            <input name="title" placeholder="New item" />
            <input name="note" placeholder="Note or link" />
            <button type="submit">Add</button>
          </form>
        </section>
      ) : (
        <section className="workspace assistant-workspace">
          <div className="workspace-head">
            <div>
              <p className="kicker">Assistant</p>
              <h1>Organizer</h1>
            </div>
            <span>{AI_MODEL}</span>
          </div>

          <form className="assistant-form" onSubmit={askAssistant}>
            <input
              value={assistantQuestion}
              onChange={(event) => setAssistantQuestion(event.target.value)}
              placeholder="Search or ask what needs attention"
            />
            <button type="submit" disabled={isAssistantLoading}>
              {isAssistantLoading ? "Thinking..." : "Ask"}
            </button>
          </form>

          <div className="assistant-answer">{assistantAnswer}</div>
          <p className="secure-note">Uses the local server endpoint with OPENAI_API_KEY.</p>
        </section>
      )}
      </main>
      {agentDrawer}
    </>
  );
}

export default App;
