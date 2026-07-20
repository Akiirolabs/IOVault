# DBG-1010 — Rich-Text Sanitization

- **Status / priority / last updated:** Confirmed pending complete sink trace; High; 2026-07-19.
- **Repository evidence:** `RichEditor` in `src/App.tsx` assigns and persists `innerHTML`; Code Vault strips notes to text only when explicitly sent to AI.
- **What is wrong / affected services and files:** HTML is accepted without an explicit sanitizer at the editing boundary; frontend/browser storage are affected.
- **Impact:** Potential stored XSS, token theft (amplifying DBG-1003), private-data access, and rendering reliability risk.
- **Best fix / why / example:** Sanitize with an allowlist at ingress and before any HTML-rendering sink; plain text where formatting is unnecessary.
- **Implementation plan / dependencies:** Trace every notes/HTML consumer, select a maintained sanitizer, define allowed formatting, migrate cached content safely.
- **Fixes attempted:** `stripHtml` limits assistant scratchpad transmission but does not sanitize stored rich text.
- **Verification commands / results:** Needs malicious fixture tests and browser rendering checks.
- **Pros / cons:** Strong XSS reduction; may remove user formatting.
- **Risks / rollback:** Content mutation; retain backup during migration and version sanitizer policy.
- **Likely next fix / final outcome:** Complete sink inventory, then sanitize before session migration; unresolved.
