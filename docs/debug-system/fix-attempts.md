# Fix Attempts — Append Only

| Date | Code | Change | Result | Tradeoff | Next |
|---|---|---|---|---|---|
| 2026-07-19 | DBG-1001 | Added AI auth, user/IP limits, payload bounds, timeout, safe errors, and metadata-only audit | **Verified:** 15 tests + build passed | Limits reset per process; full vault context remains | DBG-1002, then DBG-1005 |
| 2026-07-20 | DBG-1002 | Removed automatic vault upload; added visible current-page opt-in, bounded summaries, and server-side legacy-field ignore | **Verified:** 17 tests + build passed | Context may omit relevant data | Monitor quality; continue DBG-1005 |
