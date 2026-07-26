# IMP-1002 — Code Vault

**State:** Implemented v1 · **Priority:** P1

## Rollouts

| Child | Rollout | Status |
|---|---|---|
| `IMP-1002.1` | Mini IDE v1 | Implemented |
| `IMP-1002.2` | Refined repository workflow | Planned |

| Current | Next |
|---|---|
| Three-pane Monaco workspace, editable/deletable scratch files, named snippets, selected-context AI, patch review/undo, GitHub draft PRs | A polished end-to-end repository-change workflow with clear context, review, recovery, and publishing states |

## Steps

1. Refine repository selection, file discovery, editor tabs, and explicit context selection.
2. Make assistant progress, assumptions, changes, rejection, undo, and failure states understandable.
3. Complete connect → multi-file proposal → reject one → apply rest → draft PR acceptance.
4. Validate keyboard, responsive, offline-cache, and recovery experiences.

**Acceptance:** bounded memory and context are visible; no unapproved mutation occurs; stale bases stop publication; scratch work survives offline recovery.

**Limits:** no terminal, execution, dependency install, live preview, or direct local folders. See [mini IDE](../../code-vault-mini-ide.md) and [architecture](../../code-vault-architecture.md).

## Engineering dependencies

Memory duplication and profiling are owned by [DBG-1014](../../debug-system/issues/DBG-1014-monaco-and-react-state.md); rate limits, validation, and server modularization remain in the [engineering dependency index](../engineering-dependencies.md).
