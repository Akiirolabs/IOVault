# DBG-1014 — Monaco and React State Pressure

- **Status / priority / last updated:** Confirmed architectural concern; Medium; 2026-07-19.
- **Repository evidence:** `CodeVaultWorkspace.tsx` keeps `CodeFile[]`, including contents, in component state and passes active content into Monaco; IndexedDB provides persistence but not render isolation.
- **What is wrong / affected services and files:** Multi-file edits duplicate large text through React state, Monaco models, undo snapshots, and cache operations.
- **Impact:** Memory and responsive-render risk for larger repositories; no direct security impact.
- **Best fix / why / example:** Keep metadata in React state and file bodies/undo in Monaco models plus bounded IndexedDB services.
- **Implementation plan / dependencies:** Build a realistic fixture, measure heap/renders, define cache bounds, then move bodies behind a file-content service.
- **Fixes attempted:** Monaco is lazy-loaded and repository cache is bounded by current storage architecture; diagnostics were tuned for scratch TSX.
- **Verification commands / results:** Needs profiling, large-file, tab-switch, undo, and offline recovery tests.
- **Pros / cons:** Lower memory/render pressure; synchronization and disposal become more complex.
- **Risks / rollback:** Lost edits or stale models; preserve current storage snapshots during migration.
- **Likely next fix / final outcome:** Establish performance baselines before refactoring; unresolved.
