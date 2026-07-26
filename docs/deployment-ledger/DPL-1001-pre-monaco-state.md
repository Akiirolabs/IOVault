# DPL-1001 — Pre-Monaco Testing State

| Field | Recorded state |
|---|---|
| Status | Historical testing baseline |
| Date | 2026-07-10 |
| Commit | `1ca6534` |
| Version | Pre-Version-1.0 baseline |
| Environment | Repository-backed local testing state; no external production claim |
| Next state | [DPL-1002](DPL-1002-current-testing-state.md) |

## Architecture

| Boundary | State at `1ca6534` |
|---|---|
| Frontend | Vite, React, and TypeScript single-page application |
| API | Express API for auth, workspace persistence, AI, and GitHub status |
| Authentication | Email/password with JWT-based browser authentication |
| Persistence | SQLite users/workspaces plus browser `localStorage` cache |
| Projects | Full-page Rich Text and Markdown editor |
| Code Vault | Plain textarea editor, passive Syntax Preview, reusable snippets, notes, and GitHub Actions status |

Monaco, IndexedDB repository caching, dedicated Code Vault SQLite records, selected-file patch review, and GitHub draft-PR publication did not exist in this baseline.

## Known limitations carried forward

- Code Vault was not a repository-aware mini IDE.
- Browser authentication and AI context boundaries required later security correction.
- General workspace persistence remained a whole-state JSON upsert.

Operational evidence unavailable for this baseline—including test, hosting, secret, rollback, and monitoring results—is recorded as unknown rather than inferred.
