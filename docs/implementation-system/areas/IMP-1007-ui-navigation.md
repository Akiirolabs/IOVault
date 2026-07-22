# IMP-1007 — UI and Navigation

**State:** Partial · **Priority:** P1

## Steps

1. Define consistent navigation, workspace headers, panels, dialogs, and assistant placement.
2. Standardize loading, empty, error, offline, destructive-action, and recovery states.
3. Specify keyboard navigation, focus behavior, responsive panels, and reduced motion.
4. Apply the shared patterns incrementally to each page without changing its purpose.

**Acceptance:** page behavior and persisted data remain compatible; primary workflows work by keyboard; narrow screens preserve capability without hidden controls.

**Limit:** visual-system replacement is not required for modularization.

## Engineering dependencies

Safe extraction from `src/App.tsx` is owned by [DBG-1008](../../debug-system/issues/DBG-1008-app-component-monolith.md). This plan owns the experience the extracted components must deliver.
