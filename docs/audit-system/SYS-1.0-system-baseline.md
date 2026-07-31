# SYS-1.0 — System Baseline

Evidence-driven architecture, reliability, performance, persistence, maintainability, and UI-system findings for Version 1.0.

| DBG | Status | Finding | Impact |
|---|---|---|---|
| DBG-1001 | ✅ Verified | Responsive shell gap | Narrow-screen workspace parity |
| DBG-1007 | Open | Workspace JSON blob | Storage, recovery, migration |
| DBG-1008 | Open | Conflict-unsafe synchronization | Multi-client data integrity |
| DBG-1009 | Open | Frontend monolith | Regression and render surface |
| DBG-1010 | Open | Server monolith | Security and test isolation |
| DBG-1014 | Open | Package separation | Build and deployment boundaries |
| DBG-1015 | Open | Monaco/React state pressure | Code Vault memory and latency |
| DBG-1016 | Open | Shared UI/navigation inconsistency | Cross-page usability |
| DBG-1017 | ✅ Verified | Typed table-column behavior | Write collections |

## DBG-1001 — Responsive shell gap

**Verified · discovered/finished 2026-07-03; extended 2026-07-31.** Narrow screens lacked usable workspace parity. The original correction preserved the horizontally scrollable desktop structure. Agent Workspace acceptance later exposed a 960-pixel shell minimum that overflowed the new focused interface; the mobile shell now uses the available viewport while complex desktop workspaces retain their own bounded scrolling. Production build and 390×844 browser checks verified the agent correction.

## DBG-1007 — Workspace stored as one JSON blob

**Open · High · discovered 2026-07-19.** `workspaces.data` rewrites the entire state, limiting queries, history, permissions, recovery, and migration. Incrementally normalize high-value entities with user IDs and versions only where justified. Require dual-write parity, backfill, rollback, migration, and performance tests.

## DBG-1008 — Conflict-unsafe synchronization

**Open · High · discovered 2026-07-19.** `/api/vault` overwrites by user ID without an expected version. Add integer versions, conditional updates, HTTP 409, and a clear merge/reload path. Verify two-client races and stale-version requests.

## DBG-1009 — App component monolith

**Open · Medium · discovered 2026-07-19.** `src/App.tsx` spans authentication, state, persistence, AI, rich text, and UI. Add characterization coverage, then extract API/auth, persistence, assistant, and feature modules incrementally while checking behavior and render timing.

## DBG-1010 — Server monolith

**Open · Medium · discovered 2026-07-19.** `server/index.js` combines all route domains. Retain one composition root and extract injected routers/services, verifying the complete Supertest matrix and middleware order after each extraction.

## DBG-1014 — Package separation

**Open · Low · discovered 2026-07-19.** One package owns browser, API, database, tests, and build dependencies. Split workspaces only after runtime modules and shared types stabilize; verify clean workspace install and frontend/API matrices.

## DBG-1015 — Monaco and React state pressure

**Open · Medium · discovered 2026-07-19.** React, Monaco, undo, and IndexedDB can duplicate file bodies. Keep metadata in React and move bodies/undo ownership toward Monaco models and bounded cache services after heap/render profiling. Verify large files, tab switching, disposal, undo, and offline recovery.

## DBG-1016 — Shared UI and navigation inconsistency

**Open · discovered 2026-07-21.** Similar workspaces use inconsistent patterns. Define shared interaction contracts and acceptance checks, then adopt them incrementally. This remains a discovered cross-app issue, not speculative page work.

## DBG-1017 — Typed table-column behavior

**Verified · 2026-07-23.** Column creation/type selection relied on incomplete dialogs. Inline management now covers rename/type editing, select options, and text, number, date, checkbox, select/status, and URL cells. Thirty tests, the build, and signed-in create/edit/save/reload acceptance passed. Persistence/sync and rich-text safety remain DBG-1007/1008 and DBG-1011.
