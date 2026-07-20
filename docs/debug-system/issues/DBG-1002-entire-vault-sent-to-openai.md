# DBG-1002 — Entire Vault Sent to OpenAI

- **Status / priority / last updated:** Confirmed; Critical; 2026-07-19.
- **Repository evidence:** `requestAgent` sends `vaultState` as `vaultData` in `src/App.tsx`; `server/index.js` serializes it into the OpenAI user message.
- **What is wrong / affected services and files:** General assistant transmits broad context; frontend and AI in the two paths above.
- **Impact:** Security/privacy exposure, increased cost and latency, reliability risk from context limits, and prompt-injection surface.
- **Best fix / why / example:** Send explicit selected excerpts plus a small retrieved set, because least-context data flow reduces every cited risk; `{ message, context: selectedExcerpts }`.
- **Implementation plan / dependencies:** Define visible selection UX, server authorization for retrieved records, and size/token budgets after DBG-1001.
- **Fixes attempted:** None.
- **Verification commands / results:** Needs implementation; test captured requests and assert excluded vault sections never appear.
- **Pros / cons:** Lower cost and exposure; retrieval may omit relevant context.
- **Risks / rollback:** Answer quality can regress; retain an explicit user-controlled context expansion.
- **Likely next fix / final outcome:** Implement context selection; unresolved.
