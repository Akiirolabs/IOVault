# DBG-1010 — Rich-Text Sanitization

| Field | Detail |
|---|---|
| Status | **Confirmed, sink trace incomplete** · High · 2026-07-19 |
| Evidence | `RichEditor` in `src/App.tsx` assigns and stores `innerHTML` without an explicit sanitizer |
| Impact | Potential stored XSS, session theft, and private-data access |
| Fix | Allowlist sanitizer at ingress and every HTML sink; plain text where formatting is unnecessary |
| Verify | Malicious HTML fixtures plus browser render/persistence checks |
| Tradeoffs | Reduces XSS; may remove formatting, so back up content during migration |
| Next | Trace every HTML consumer and sanitize to reduce residual XSS risk |
