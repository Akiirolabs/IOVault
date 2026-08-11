# Quality Gates

Apply gates in order. Record unavailable gates instead of skipping them silently.

## Baseline

```bash
git status --short
git diff --stat
```

Preserve unrelated and pre-existing changes. Record baseline failures separately from cycle regressions.

## Automated gates on macOS

```bash
npm test
npm run build
git diff --check
```

IO Vault currently has no `lint` script. Record lint as unavailable. If `package.json` later adds one, run:

```bash
npm run lint
```

Do not install or upgrade dependencies merely to make a gate available without explicit user approval.

## Focused verification

- Run the smallest relevant Vitest or Supertest scope while implementing, then run the full test suite.
- Verify the real affected browser workflow when UI behavior changes; do not substitute recreated state objects for user actions.
- Validate persistence, authentication, ownership isolation, and API error behavior when their boundaries change.
- Validate Markdown links and protected Mermaid fences when documentation architecture changes.

## Core application scenarios

Run only scenarios affected by the selected findings, then record any unavailable environment or external dependency:

- authenticate, load the user workspace, save a change, reload, and confirm isolation;
- create, edit, select, delete, undo, save, reload, and recover supported Write or Projects content;
- open, edit, rename, delete, cache, and restore Code Vault scratch files without corrupting snippets or unrelated tabs;
- verify selected AI context, bounded payloads, authenticated errors, streaming recovery, patch review, and approval boundaries where applicable;
- verify Learning and Career conversations, durable tasks, cancellation, approvals, and recovery without pretending unavailable connectors passed;
- confirm storage failures and rejected data are visible and never report false success.

## Resource and performance integrity

- No unbounded event listeners, timers, requests, editor models, object URLs, audio streams, or background work after ownership ends.
- Repeated create/delete, open/close, connect/disconnect, and start/cancel cycles do not show unbounded resource growth.
- Monaco, agent streaming, navigation, and large workspace operations remain responsive at supported limits.
- Removed or replaced controllers, workers, streams, subscriptions, and cached records are disposed or invalidated safely.

## Review gate

- Diff contains no unrelated edits, secrets, generated artifacts, or debug logging.
- Tests were not weakened to obtain a pass.
- No critical or high DevMind finding remains confirmed.
- DevMind reviews the final diff after the last DevBase edit.

## Evidence

Record each command, exit result, relevant output, unavailable gate, and environment limitation. A build or test result from before the final diff does not verify the final diff.
