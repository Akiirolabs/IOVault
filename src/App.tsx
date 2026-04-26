import { FormEvent, useMemo, useState } from "react";

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

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("code");
  const [vaultData, setVaultData] = useState<VaultData>(getSavedVaultData);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("Ask for a reminder or search your vault.");

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

  function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = assistantQuestion.trim().toLowerCase();
    const allItems = sections.flatMap((section) =>
      vaultData[section.key].map((item) => ({ ...item, section: section.title })),
    );

    if (!question) {
      setAssistantAnswer("Ask: what needs attention? or search a project, course, company, or tool.");
      return;
    }

    const needsAttention = allItems.filter((item) => item.status !== "Done");

    if (question.includes("remind") || question.includes("attention") || question.includes("todo")) {
      setAssistantAnswer(
        needsAttention.length
          ? needsAttention
              .slice(0, 4)
              .map((item) => `${item.title} - ${item.section}`)
              .join(" | ")
          : "Everything is marked done.",
      );
      return;
    }

    const matches = allItems.filter((item) =>
      `${item.title} ${item.note} ${item.section}`.toLowerCase().includes(question),
    );

    setAssistantAnswer(
      matches.length
        ? matches
            .slice(0, 5)
            .map((item) => `${item.title} - ${item.section}`)
            .join(" | ")
        : "No match yet. Add it to a tab so I can track it.",
    );
  }

  if (!isUnlocked) {
    return (
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
    );
  }

  return (
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
            <span>Local</span>
          </div>

          <form className="assistant-form" onSubmit={askAssistant}>
            <input
              value={assistantQuestion}
              onChange={(event) => setAssistantQuestion(event.target.value)}
              placeholder="Search or ask what needs attention"
            />
            <button type="submit">Ask</button>
          </form>

          <div className="assistant-answer">{assistantAnswer}</div>
          <p className="secure-note">API key connection should use a secure backend.</p>
        </section>
      )}
    </main>
  );
}

export default App;
