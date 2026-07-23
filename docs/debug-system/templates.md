# Debug Templates

## Issue

| Field | Detail |
|---|---|
| Status | Unverified · Priority · YYYY-MM-DD |
| Evidence | Real paths and observed behavior |
| Impact | Security, privacy, reliability, performance |
| Fix | Best fix and minimal implementation |
| Verify | Tests, commands, and actual result |
| Tradeoffs | Pros, cons, risks, rollback |
| Next | Dependency or likely next fix |

Use **Needs verification** instead of assumptions.

## Fix-attempt row

| Date | Code | Change | Result | Tradeoff | Next |
|---|---|---|---|---|---|
| YYYY-MM-DD | DBG-XXXX | Smallest complete fix | Successful / Failed / Partial / Rolled back + test summary | Main limitation | Next action |

## Verification record

| Requirement | Command or test | Expected | Actual | Pass |
|---|---|---|---|---|
| Behavior | `command` | Expected result | Not run | No |

Never record a pass until the command runs against the documented implementation state.
