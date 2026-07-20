# DBG-1008 — App Component Monolith

- **Status / priority / last updated:** Confirmed; Medium; 2026-07-19.
- **Repository evidence:** `src/App.tsx` is 1,500 lines and combines state, auth, persistence, assistant logic, rich text, and feature rendering.
- **What is wrong / affected services and files:** Broad coupling increases regression and review cost across the React frontend.
- **Impact:** Maintainability and reliability risk; broad rerenders may affect performance; security fixes are harder to isolate.
- **Best fix / why / example:** Add characterization tests, then extract cohesive hooks/services/components without behavior changes.
- **Implementation plan / dependencies:** Extract API/auth, persistence, assistant, and feature panels incrementally; preserve public state contracts.
- **Fixes attempted:** Code Vault is already extracted into `src/codeVault/`.
- **Verification commands / results:** Needs UI characterization, build, and targeted interaction tests per extraction.
- **Pros / cons:** Smaller boundaries; refactor churn can hide regressions.
- **Risks / rollback:** State timing changes; use one reversible extraction per commit.
- **Likely next fix / final outcome:** Expand characterization coverage; unresolved.
