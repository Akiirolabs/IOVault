# IMP-1004 — Mentor Agent

**State:** Partial · **Priority:** P2

## Numbered implementation

| Code | Outcome | Status |
|---|---|---|
| `IMP-1004.1` | Current learning workspace | Partial |
| &emsp;↳ `IMP-1004.1.1` | Preserve current notes, connections, and weekly focus | Partial |
| &emsp;↳ `IMP-1004.1.2` | Extract Learning from the frontend monolith without data loss | Planned |
| `IMP-1004.2` | Mentor Agent | Planned |
| &emsp;↳ `IMP-1004.2.1` | Conversational learning-profile onboarding | Planned |
| &emsp;↳ `IMP-1004.2.2` | User-approved curriculum, milestones, sessions, and schedule | Planned |
| &emsp;↳ `IMP-1004.2.3` | Lessons, exercises, quizzes, projects, and Code Vault practice | Planned |
| &emsp;↳ `IMP-1004.2.4` | Evidence-based assessment and adaptive skill confidence | Planned |
| &emsp;↳ `IMP-1004.2.5` | Scheduled runs, notifications, pause controls, and auditable history | Planned |
| &emsp;↳ `IMP-1004.2.6` | Approved calendar, course, and content connectors | Planned |

The current Learning page stores notes, connections, and weekly focus. The target is a conversational Mentor Agent that learns the user’s goals and skill level, teaches actively, assigns work, evaluates progress, and adapts the learning plan over time.

## `IMP-1004.2.1–1004.2.6` target experience

| Capability | Target behavior |
|---|---|
| Onboarding | Build a learning profile from conversation, selected workspace evidence, and optional uploaded materials |
| Mentoring | Hold ongoing teaching conversations with memory, goals, explanations, examples, and questions |
| Planning | Create and revise curricula, milestones, sessions, assignments, and study schedules |
| Practice | Generate exercises, quizzes, projects, and Code Vault tasks at the learner’s current level |
| Assessment | Evaluate submitted work against visible criteria, explain mistakes, and update skill confidence |
| Autonomy | Prepare the next lesson, schedule approved reminders, and maintain progress without waiting for a new prompt |
| Evidence | Link mastered skills to notes, projects, Code Vault work, assessments, and user-confirmed outcomes |

## Agent workflow

1. The user describes what they want to learn or selects existing goals and evidence.
2. The Mentor Agent assesses current knowledge and proposes a plan with measurable outcomes.
3. The user approves the plan, schedule, allowed context, and notification permissions.
4. The agent runs teaching sessions, assigns practice, reviews responses, and adapts difficulty.
5. Every autonomous run records its trigger, context, output, result, and next action without storing hidden reasoning.

## Data and controls

Store user-scoped learning profiles, goals, plans, mentor sessions, lessons, assignments, assessments, skill evidence, schedules, agent runs, and approvals in dedicated records. The agent receives only selected or policy-approved context. External enrollment, purchases, public posting, credential claims, and messages always require explicit approval.

## Delivery

1. Extract the current Learning UI from the application monolith and preserve existing notes, connections, and weekly focus.
2. Add the Mentor chat, learning-profile onboarding, plan review, session history, and evidence views.
3. Add scheduled agent runs, assignment/assessment tools, notifications, pause controls, and run history.
4. Add approved calendar, course-provider, and content connectors only where official APIs permit them.

**Acceptance:** the user can start from conversation, receive and approve a personalized plan, complete a teaching session and assignment, receive evidence-based feedback, and see the next mentor action scheduled. Context use, autonomous runs, and external actions remain visible and controllable.

**Limits:** the mentor cannot certify credentials, purchase courses, enroll the user, publish work, or contact third parties without approval. Course synchronization depends on official provider access.

## Engineering dependencies

Storage, conflict-safe sync, agent rate limits, explicit context, credential isolation, validation, audit history, notifications, and frontend/server boundaries must pass the SEC/SYS dependencies in the consolidated [implementation index](../README.md) before unattended runs are enabled.
