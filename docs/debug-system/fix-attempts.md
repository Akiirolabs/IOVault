# Fix Attempts — Append Only

| Date | Code | Change | Result | Tradeoff | Next |
|---|---|---|---|---|---|
| 2026-07-19 | DBG-1001 | Added AI auth, user/IP limits, payload bounds, timeout, safe errors, and metadata-only audit | **Verified:** 15 tests + build passed | Limits reset per process; full vault context remains | DBG-1002, then DBG-1005 |
