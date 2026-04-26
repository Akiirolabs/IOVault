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
  description: string;
};

type VaultData = Record<VaultSection["key"], VaultItem[]>;

const sections: VaultSection[] = [
  {
    key: "code",
    title: "Code Vault",
    description: "Keep projects, repos, tests, bugs, and build notes organized.",
  },
  {
    key: "learning",
    title: "Learning Progress",
    description: "Track courses, skills, videos, certificates, and practice goals.",
  },
  {
    key: "career",
    title: "Career Applications",
    description: "Manage job applications, referrals, interviews, and follow-ups.",
  },
  {
    key: "integrations",
    title: "App Integrations",
    description: "Plan connected tools like GitHub, learning sites, calendars, and AI.",
  },
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
      note: "Connect GitHub Actions so IO Vault can show whether tests passed.",
    },
  ],
  learning: [
    {
      id: "learning-1",
      title: "Weekly learning focus",
      status: "In progress",
      note: "Choose one course from freeCodeCamp, Coursera, edX, MIT OCW, or Khan Academy.",
    },
    {
      id: "learning-2",
      title: "Practice log",
      status: "Planned",
      note: "Record what you learned, what confused you, and what to review next.",
    },
  ],
  career: [
    {
      id: "career-1",
      title: "Application tracker",
      status: "In progress",
      note: "Save company, role, date applied, contact, interview stage, and next follow-up.",
    },
    {
      id: "career-2",
      title: "Interview prep",
      status: "Planned",
      note: "Build answer notes for projects, teamwork, leadership, and technical problem solving.",
    },
  ],
  integrations: [
    {
      id: "integrations-1",
      title: "AI assistant",
      status: "Planned",
      note: "Use a secure backend before connecting your API key so it does not ship to the browser.",
    },
    {
      id: "integrations-2",
      title: "GitHub Actions",
      status: "Planned",
      note: "Pull latest workflow runs and summarize passing or failing tests.",
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
  const [vaultData, setVaultData] = useState<VaultData>(getSavedVaultData);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState(
    "Ask me what to work on, where something is saved, or what still needs attention.",
  );

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
          note: note || "Add details, links, dates, or next steps here.",
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
      setAssistantAnswer("Ask a question like 'what needs attention?' or search for a project, course, company, or integration.");
      return;
    }

    const needsAttention = allItems.filter((item) => item.status !== "Done");

    if (question.includes("remind") || question.includes("attention") || question.includes("todo")) {
      setAssistantAnswer(
        needsAttention.length
          ? `Reminder: ${needsAttention
              .slice(0, 4)
              .map((item) => `${item.title} (${item.section})`)
              .join(", ")} still need attention.`
          : "Everything is marked done. Add the next goal when you are ready.",
      );
      return;
    }

    const matches = allItems.filter((item) =>
      `${item.title} ${item.note} ${item.section}`.toLowerCase().includes(question),
    );

    setAssistantAnswer(
      matches.length
        ? `Found ${matches.length} match${matches.length === 1 ? "" : "es"}: ${matches
            .slice(0, 5)
            .map((item) => `${item.title} in ${item.section}`)
            .join(", ")}.`
        : "I did not find that yet. Add it to the right vault card so I can help you track it.",
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
      <header className="dashboard-header">
        <div>
          <p className="kicker">Unlocked</p>
          <h1>IO Vault</h1>
          <p className="dashboard-copy">
            Your command center for code, learning, career applications, integrations, and assistant reminders.
          </p>
        </div>
        <div className="progress-card">
          <strong>{progress.percent}%</strong>
          <span>{progress.done} done / {progress.active} active / {progress.total} total</span>
        </div>
      </header>

      <section className="assistant-panel">
        <div>
          <p className="kicker">AI Assistant Prep</p>
          <h2>Organizer and Finder</h2>
          <p>
            This local assistant can search your vault and create reminders now. When you are ready, we can connect your API key through a secure backend.
          </p>
        </div>
        <form onSubmit={askAssistant}>
          <input
            value={assistantQuestion}
            onChange={(event) => setAssistantQuestion(event.target.value)}
            placeholder="Ask: what needs attention? or search GitHub, Coursera, applications..."
          />
          <button type="submit">Ask</button>
        </form>
        <div className="assistant-answer">{assistantAnswer}</div>
      </section>

      <section className="vault-grid">
        {sections.map((section) => (
          <article className="vault-card" key={section.key}>
            <div className="card-heading">
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <span>{vaultData[section.key].length}</span>
            </div>

            <div className="vault-items">
              {vaultData[section.key].map((item) => (
                <div className="vault-item" key={item.id}>
                  <input
                    value={item.title}
                    onChange={(event) =>
                      updateItem(section.key, item.id, { title: event.target.value })
                    }
                    aria-label={`${item.title} title`}
                  />
                  <textarea
                    value={item.note}
                    onChange={(event) =>
                      updateItem(section.key, item.id, { note: event.target.value })
                    }
                    aria-label={`${item.title} notes`}
                  />
                  <div className="item-row">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        updateItem(section.key, item.id, { status: event.target.value as Status })
                      }
                      aria-label={`${item.title} status`}
                    >
                      <option>Planned</option>
                      <option>In progress</option>
                      <option>Done</option>
                    </select>
                    <button type="button" onClick={() => removeItem(section.key, item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form className="add-item" onSubmit={(event) => addItem(section.key, event)}>
              <input name="title" placeholder={`Add to ${section.title}`} />
              <input name="note" placeholder="Notes, links, or next step" />
              <button type="submit">Add</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
