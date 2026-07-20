# DBG-1011 — Inconsistent Input Validation

| Field | Detail |
|---|---|
| Status | **Confirmed** · High · 2026-07-19 |
| Evidence | `server/index.js` uses varied manual checks; only DBG-1001 has a focused shared validator |
| Impact | Malformed data, inconsistent errors, and resource-exhaustion risk |
| Fix | Shared boundary schemas with normalized typed output and consistent errors |
| Verify | Boundary and malformed-payload tests for every write/expensive route |
| Tradeoffs | Predictable contracts; previously accepted payloads may become invalid |
| Next | Inventory contracts; validate auth and vault writes first |
