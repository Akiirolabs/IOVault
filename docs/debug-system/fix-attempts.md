# Fix Attempts — Append Only

| Date | Code | Change | Result | Tradeoff | Next |
|---|---|---|---|---|---|
| 2026-07-19 | DBG-1001 | Added AI auth, user/IP limits, payload bounds, timeout, safe errors, and metadata-only audit | **Verified:** 15 tests + build passed | Limits reset per process; full vault context remains | DBG-1002, then DBG-1005 |
| 2026-07-20 | DBG-1002 | Removed automatic vault upload; added visible current-page opt-in, bounded summaries, and server-side legacy-field ignore | **Verified:** 17 tests + build passed | Context may omit relevant data | Monitor quality; continue DBG-1005 |
| 2026-07-21 | DBG-1003 | Moved browser auth to HttpOnly SameSite cookies; added CSRF checks, logout, and legacy-token cleanup | **Verified:** 20 tests + build passed | Bearer API compatibility remains; offline logout cannot clear a server cookie | DBG-1004 production secret |
| 2026-07-03 | DBG-IMP-1011 · DBG-1015 | Preserved desktop workspace behavior on narrow screens | **Verified:** recorded build and 1280×800/390×844 browser checks | Horizontal scrolling remains intentional | Monitor responsive parity |
