# IMP-1004 — Mentor Agent

**State:** Partial · **Priority:** P2

## Numbered implementation

| Code | Outcome | Status |
|---|---|---|
| `IMP-1004.1` | Learning workspace migration | Implemented |
| &emsp;↳ `IMP-1004.1.1` | Preserve notes, connections, and weekly focus in the user-scoped Mentor profile | Implemented |
| &emsp;↳ `IMP-1004.1.2` | Extract Learning into the shared Agent Workspace without data loss | Implemented |
| `IMP-1004.2` | Mentor Agent | Partial |
| &emsp;↳ `IMP-1004.2.1` | Conversational learning profile with text, push-to-talk, transcripts, and spoken replies | Partial |
| &emsp;↳ `IMP-1004.2.2` | Curriculum, milestones, sessions, assignments, and approved schedules | Partial |
| &emsp;↳ `IMP-1004.2.3` | Lessons, exercises, quizzes, projects, resources, and selected Code Vault practice | Partial |
| &emsp;↳ `IMP-1004.2.4` | Evidence-based assessment and adaptive skill confidence | Partial |
| &emsp;↳ `IMP-1004.2.5` | **① Durable task execution**, **② pause/approval controls**, and **③ auditable history**; scheduled notifications remain planned | Partial |
| &emsp;&emsp;↳ `IMP-1004.2.5.1` | **①** SQLite-backed tasks, runs, leases, restart recovery, bounded retries, and SSE events | Implemented |
| &emsp;&emsp;↳ `IMP-1004.2.5.2` | **②** Review-first action approvals, rejection, cancellation, exact-payload execution, and emergency-safe failures | Implemented |
| &emsp;&emsp;↳ `IMP-1004.2.5.3` | **③** Persistent conversations, records, task state, approval state, and activity views | Implemented |
| &emsp;↳ `IMP-1004.2.6` | Google Calendar plus approved course and content connectors | Partial |
| &emsp;&emsp;↳ `IMP-1004.2.6.1` | Encrypted Google OAuth connection and approval-gated Calendar event creation | Implemented; external verification pending credentials |

The Learning page now centers a continuously active Mentor orb backed by durable conversations, tasks, runs, records, approvals, and a review-first Google connector. Legacy notes, connections, and weekly focus migrate once into the user-scoped Mentor profile and are removed from the browser workspace cache after successful migration.

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

Google credentials, consent, deployed callback configuration, hosted-worker requirements, and future LMS access are maintained in [EDEP-1001](EDEP/EDEP-1001.md), which links back to this implementation as its owner.

## Verification

**Partial implementation verified 2026-07-31.** Sixty-three automated tests and the production build passed. Signed-in browser acceptance verified legacy migration, the continuously glowing Mentor interface, compact Tasks/Approvals/Activity/Integrations/Settings navigation, text and voice controls, reduced-width rendering, and honest Google configuration state. External Google event creation, scheduled notifications, complete onboarding, resource upload, Code Vault selection, and end-to-end assessment remain unverified or planned.
