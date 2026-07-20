# DBG-1002 — Entire Vault Sent to OpenAI

| Field | Detail |
|---|---|
| Status | **Confirmed** · Critical · 2026-07-19 |
| Evidence | `src/App.tsx` sends `vaultState`; `server/index.js` serializes it into the OpenAI message |
| Impact | Privacy exposure, cost, latency, context overflow, prompt injection |
| Fix | Send visible user-selected excerpts plus a small authorized retrieval set |
| Verify | Capture outbound requests; assert excluded vault sections never appear |
| Tradeoffs | Lower exposure and cost; retrieval can omit useful context; allow explicit expansion |
| Next | Define context-selection UX and relevance tests |
