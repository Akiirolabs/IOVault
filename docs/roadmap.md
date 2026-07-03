# Roadmap

This file tracks planned work and implementation notes. Move completed items into `implementation-log.md`.

## Near Term

### Keep Docs In Sync With Code

- Update the docs folder whenever app flow, data shape, API behavior, or layout behavior changes.
- Add dated notes to `implementation-log.md` for every meaningful implementation change.
- Update Mermaid diagrams when a flow or architecture boundary changes.

### Improve Responsive Usability Without Changing Layout Shape

Current policy keeps the same desktop structure on mobile and uses horizontal scrolling. Planned refinements should preserve that policy unless the product direction changes.

Possible implementation work:

- Add clear scroll affordance for narrow screens.
- Ensure fixed drawers and floating panels do not cover key controls on mobile.
- Test all pages at `390x844`, `768x1024`, and `1280x800`.

### Split App Into Smaller Components

`src/App.tsx` currently owns state, data normalization, page rendering, AI calls, and page-specific UI. This is workable, but future changes will be easier if the file is split.

Possible implementation work:

- `src/types.ts` for shared state types.
- `src/storage.ts` for `defaultVaultState`, `normalizeVaultState`, and `getSavedVaultState`.
- `src/ai.ts` for frontend AI request helpers and offline fallback behavior.
- `src/components/AgentDrawer.tsx`.
- `src/components/WorkspaceNav.tsx`.
- `src/pages/CodeVault.tsx`, `WritePage.tsx`, `LearningPage.tsx`, `CareerPage.tsx`, `ProjectsPage.tsx`.

### Align AI Model Configuration

`src/aiConfig.ts` and `server/index.js` both reference `gpt-4o-mini`. Keep them synchronized or move the backend model to environment configuration and return the active model to the UI.

Possible implementation work:

- Add `OPENAI_MODEL` support in `server/index.js`.
- Keep `src/aiConfig.ts` as UI fallback text only.
- Show the server-returned model after successful AI calls.

## Later

### Data Export And Import

Add a way to export and import the saved `VaultState`.

Possible implementation work:

- Export JSON from localStorage.
- Validate imported JSON with `normalizeVaultState`.
- Add confirmation before replacing existing workspace state.

### Tests

Add focused tests around pure logic and high-risk UI behavior.

Possible implementation work:

- Unit tests for `normalizeVaultState`.
- Unit tests for `highlightCode` and `answerBasicQuestion`.
- Browser checks for responsive layout parity.
- API tests for `/api/agent` validation behavior.

### Persistence Upgrade

LocalStorage is enough for the current app, but larger documents and cross-device sync may require a stronger persistence layer.

Possible implementation work:

- IndexedDB for larger local documents.
- Optional backend persistence.
- Auth-gated cloud sync.
