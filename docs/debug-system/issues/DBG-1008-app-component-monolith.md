# DBG-1008 — App Component Monolith

| Field | Detail |
|---|---|
| Status | **Confirmed** · Medium · 2026-07-19 |
| Evidence | `src/App.tsx` is 1,500 lines spanning auth, state, persistence, AI, rich text, and UI |
| Impact | Large regression/review surface and possible broad rerenders |
| Fix | Add characterization tests; extract API/auth, persistence, assistant, and feature modules incrementally |
| Verify | UI behavior, persistence, auth, and build after each extraction |
| Tradeoffs | Clearer boundaries; refactor can change state timing |
| Next | Expand tests, then make one reversible extraction per commit |
