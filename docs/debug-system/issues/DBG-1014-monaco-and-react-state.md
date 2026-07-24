# DBG-1014 — Monaco and React State Pressure

| Field | Detail |
|---|---|
| Status | **Planned** · Medium · 2026-07-19 |
| Evidence | `CodeVaultWorkspace.tsx` keeps file contents in React state while Monaco and undo/cache layers also hold them |
| Impact | Memory duplication and render latency for larger repositories |
| Fix | Keep metadata in React; move bodies/undo to Monaco models and bounded IndexedDB services |
| Verify | Heap/render baseline, large files, tab switching, undo, and offline recovery |
| Tradeoffs | Lower pressure; model disposal and synchronization become more complex |
| Next | Build a realistic performance fixture before refactoring |
