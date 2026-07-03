# Architecture and Implementation Map

## Runtime Stack

- Frontend: Vite, React, TypeScript, global CSS.
- Backend: Express server for AI requests.
- AI provider: OpenAI SDK through `server/index.js`.
- Local persistence: browser `localStorage` under `io-vault-workspace`.
- Styling: `src/styles.css`, with dashboard, page, drawer, and responsive rules colocated in one global stylesheet.

## Main Files

- `src/main.tsx`: mounts the React app and imports global styles.
- `src/App.tsx`: owns app state, persistence, page rendering, local fallback assistant logic, and frontend AI calls.
- `src/styles.css`: owns visual system, workspace shell, page grids, drawers, editor panels, and responsive layout behavior.
- `src/aiConfig.ts`: exposes the model label shown in the UI.
- `server/index.js`: loads environment config and exposes `POST /api/agent`.
- `vite.config.ts`: Vite configuration.
- `package.json`: scripts and dependencies.

## User Flow

1. User opens the app and sees the unlock screen.
2. User clicks `Unlock`.
3. Dashboard opens with a left workspace navigation rail and active page content.
4. User edits workspace content.
5. Changes write through to `localStorage`.
6. User can open the AI drawer from any screen.
7. AI requests call `/api/agent`; if unavailable, simple fallback answers handle greetings, date/time, and basic math.

## Workspace Pages

- Code Vault: code editor, syntax preview, notes, saved snippets, floating snippet preview.
- Write: blank rich-text writing canvas with basic formatting controls.
- Learning: documentation notes, learning connections drawer, mini calendar.
- Career: resume editor and AI revision draft.
- Projects: project stats and project blocks with status and notes.

## Data Model

The primary saved object is `VaultState` in `src/App.tsx`.

Important fields:

- `code`: language, editor text, notes HTML, snippets.
- `write`: document HTML.
- `learning`: docs HTML, connection cards, calendar focus.
- `career`: resume text and AI draft text.
- `projects`: project blocks.
- `settings`: navigation icon choices.

`normalizeVaultState` merges saved state with defaults so older or partial saves do not break the app.

## AI Request Contract

Frontend call:

```ts
POST /api/agent
{
  "message": "user prompt",
  "vaultData": { "code": "...", "learning": "...", "...": "..." }
}
```

Backend response:

```ts
{
  "answer": "assistant response",
  "model": "gpt-4o-mini"
}
```

Error response:

```ts
{
  "error": "message"
}
```

## Responsive Layout Policy

The dashboard is intended to look structurally the same on desktop and mobile:

- The navigation remains a left vertical rail.
- The workspace shell remains beside the nav.
- Workspace pages keep their column layout.
- Mobile uses horizontal scrolling instead of changing into a stacked layout.
- The closed nav uses `4.25rem`; the open nav uses `14rem`.
- The dashboard has `width: max(100%, 960px)` so mobile preserves the same layout proportions.

Implementation:

- `body` allows horizontal overflow.
- `.vault-dashboard` owns the fixed minimum dashboard width.
- `.page-grid` uses stable minimum column widths.
- Mobile media rules preserve the grid instead of converting the nav to a horizontal top rail.

## Verification Baseline

Run:

```bash
npm run build
```

For responsive layout changes, verify:

- Desktop viewport around `1280x800`.
- Mobile viewport around `390x844`.
- Closed and open nav states.
- At least one two-column workspace page.
