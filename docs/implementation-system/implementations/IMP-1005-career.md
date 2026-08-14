# IMP-1005 — Agent C · Career

**State:** Partial · **Priority:** P2

## Numbered implementation

| Code | Outcome | Status |
|---|---|---|
| `IMP-1005.1` | Career workspace migration | Partial |
| &emsp;↳ `IMP-1005.1.1` | Preserve the current resume and AI draft in a user-scoped career profile | Implemented |
| &emsp;↳ `IMP-1005.1.2` | Upload and parse resumes into user-confirmed claims and skills | Planned |
| `IMP-1005.2` | Career Agent | Partial |
| &emsp;↳ `IMP-1005.2.1` | Conversational career profile, text and voice interaction, and evidence linking | [FTR-1011](../../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md) · Implemented and verified |
| &emsp;&emsp;↳ `IMP-1005.2.1.1` | Continuous recoverable conversation transcript | [FTR-1011.1](../../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md#findings) · Implemented and verified |
| &emsp;&emsp;↳ `IMP-1005.2.1.2` | Softer human conversational tone within Career truthfulness and policy boundaries | [FTR-1011.2](../../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md#findings) · Implemented and verified |
| &emsp;&emsp;↳ `IMP-1005.2.1.3` | Left-side active transcript with responsive accessible fallback | [FTR-1011.3](../../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md#findings) · Implemented and verified |
| &emsp;&emsp;↳ `IMP-1005.2.1.4` | Non-looping voice lifecycle with explicit stop, mute, and cancel controls | [FTR-1011.5](../../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md#findings) · Implemented and verified |
| &emsp;&emsp;↳ `IMP-1005.2.1.5` | One-button WebRTC conversation with semantic turn detection, interruption, bounded sessions, and authoritative End cleanup | Implemented and verified within repository gates |
| &emsp;↳ `IMP-1005.2.2` | Web-assisted opportunity discovery, deduplication, scoring, and visible reasons | Partial |
| &emsp;↳ `IMP-1005.2.3` | Truthful application materials and unanswered-question handling | Partial |
| &emsp;↳ `IMP-1005.2.4` | Review mode with exact-payload approval before every external action | Implemented |
| &emsp;↳ `IMP-1005.2.5` | **① Opportunity records**, **② interview/follow-up records**, and **③ durable run history** | Partial |
| &emsp;&emsp;↳ `IMP-1005.2.5.1` | **①** User-scoped opportunities, applications, freelance leads, search policies, and career claims | Implemented |
| &emsp;&emsp;↳ `IMP-1005.2.5.2` | **②** Interview and follow-up records with approval-gated Calendar actions | Implemented; external verification pending credentials |
| &emsp;&emsp;↳ `IMP-1005.2.5.3` | **③** Persistent conversations, SQLite tasks/runs, restart recovery, cancellation, approvals, and activity views | Implemented |
| &emsp;&emsp;&emsp;↳ `IMP-1005.2.5.3.1` | Confirmed **Saved to cloud** status with continuous persistence and meaningful validation feedback | [FTR-1011.4](../../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md#findings) · Implemented and verified |
| &emsp;↳ `IMP-1005.2.6` | Google OAuth with Gmail draft and Calendar actions, idempotency, retries, and audit history | Implemented; external verification pending credentials |
| &emsp;↳ `IMP-1005.2.7` | Connector-specific bounded autopilot after security and acceptance gates | Planned |

The Career page now centers a continuously active Career orb backed by a durable review-first agent runtime. The existing resume and draft migrate into a user-scoped server profile; conversations, tasks, runs, approvals, connector actions, and career records remain outside `VaultState` and browser storage.

## `IMP-1005.1–1005.2` target experience

| Capability | Target behavior |
|---|---|
| Profile | Learn goals, skills, constraints, compensation, location, work authorization, and preferences through conversation |
| Resume intake | Parse an uploaded resume into editable claims and skills; require confirmation before treating extracted data as true |
| Evidence | Link every skill and accomplishment to user-approved resume content, projects, learning, notes, and Code Vault work |
| Discovery | Search connected job, ATS, email, calendar, and freelance sources; deduplicate and rank opportunities |
| Preparation | Select an approved resume version and draft truthful answers, cover letters, proposals, and follow-ups |
| Applications | Submit only through supported official connectors or an explicitly approved interaction path |
| Tracking | Maintain status, source, materials, timestamps, contacts, interviews, follow-ups, outcomes, and run history |
| Fiverr/freelance | Track gigs, briefs, proposals, messages, and outcomes where official platform access permits it |

## Operating modes

| Mode | Submission rule |
|---|---|
| Review | Default: agent finds and prepares; the user approves every application or proposal |
| Bounded autopilot | Optional: agent may submit inside an explicit policy covering platforms, roles, locations, compensation, daily caps, approved materials, and answer templates |
| Pause and ask | Required for new screening questions, legal attestations, demographic/EEO fields, work authorization ambiguity, salary exceptions, relocation, payments, CAPTCHA, or unsupported platform behavior |

The agent never invents experience, bypasses platform controls, impersonates the user outside granted authority, or hides that an application was submitted. Autopilot can be paused instantly and every external action must be idempotent, attributable, and auditable.

## Agent workflow

1. Build a confirmed career profile from conversation, resume upload, and explicitly selected evidence.
2. Connect supported services with OAuth or platform-approved credentials held server-side.
3. Discover and score opportunities against visible reasons and user policy.
4. Generate truthful, job-specific materials and identify unanswered questions or weak evidence.
5. Review or submit according to the active mode, then record the exact materials and external result.
6. Monitor approved inbox/calendar/webhook sources, schedule follow-ups, and update the pipeline.

## Integration strategy

- Prefer official OAuth, APIs, webhooks, feeds, and approved partnerships; never store platform passwords in `VaultState` or browser storage.
- Treat LinkedIn, Indeed, Fiverr, and similar marketplaces as capability-gated adapters, not guaranteed integrations.
- Support ATS connectors individually. Greenhouse documents job-board application submission, but it requires the board owner’s API key and is not a universal applicant credential.
- LinkedIn Talent APIs require approved partner access and primarily serve employers/ATS systems, so applicant automation cannot be assumed.
- Fiverr remains tracking and assisted workflow until an official marketplace API or approved partnership supports the required seller actions.

Official feasibility references: [Greenhouse Job Board API](https://developers.greenhouse.io/job-board), [LinkedIn Talent API access requirements](https://learn.microsoft.com/en-us/linkedin/talent/job-postings/api/overview), [Indeed integration review](https://developer.indeed.com/public/pdf/indeed-apply/integration-review-checklist.pdf), and [Fiverr developer ecosystem](https://developers.fiverr.com/content).

## Data and delivery

Store user-scoped career profiles, source evidence, resume versions, opportunity records, application packages, submissions, contacts, follow-ups, connector accounts, policies, approvals, and agent runs in dedicated records.

1. Preserve and migrate the current resume while adding upload, parsing, claim confirmation, and evidence linking.
2. Add Career Agent chat, opportunity inbox, ranking reasons, application workspace, and pipeline.
3. Add server-side connector credentials, adapter contracts, webhooks/polling, idempotency, retry controls, and audit history.
4. Release Review mode first; enable bounded autopilot per connector only after platform, security, and end-to-end acceptance.

**Acceptance:** the user can upload a resume, confirm extracted skills, define a search policy, connect one supported source, review ranked opportunities, approve a truthful application, and see the submission and follow-up tracked. Autopilot acceptance additionally requires caps, pause controls, duplicate prevention, failure recovery, and complete audit history.

**Limits:** platform access varies and may require commercial partnerships. Unsupported sites, CAPTCHA, prohibited automation, legal attestations, payments, and ambiguous questions stop the run for the user.

## Engineering dependencies

Storage, conflict-safe sync, agent quotas, credential encryption, connector isolation, validation, idempotency, audit history, file scanning, and frontend/server boundaries must pass the SEC/SYS dependencies in the consolidated [implementation index](../README.md) before application submission is enabled.

Google credentials, consent, deployed callback configuration, hosted-worker requirements, and marketplace-access boundaries are maintained in [EDEP-1002](EDEP/EDEP-1002.md), which links back to this implementation as its owner.

## Verification

**Partial implementation verified through 2026-08-14.** Career supports an explicitly started, one-button Realtime voice session using `gpt-realtime-2.1-mini`, semantic turn detection, interruption, and a ten-minute client ceiling. Ephemeral credentials are minted server-side; Realtime receives no application or connector tools; durable Career tasks and approvals remain authoritative. User voice turns persist with idempotent identifiers, while live assistant speech is transcribed into the visible conversation without being treated as authoritative cloud history. Focused voice and transcript tests, API tests, the production build, and lifecycle re-audit passed. Live microphone, acoustic, mobile-browser, and provider acceptance remain required.
