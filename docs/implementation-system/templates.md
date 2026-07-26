# Implementation Templates

## Area plan

```md
## IMP-XXXX — Area

**State:** Planned · **Priority:** P?

| Current | Target |
|---|---|
| Evidence-based behavior | Intended user outcome |

## Steps
1. Smallest coherent user-facing phase.

**Acceptance:** measurable outcomes.
**Limits:** explicit non-goals.

## Engineering dependencies
Link DBG records through `engineering-dependencies.md`; never duplicate remediation status or evidence.
```

## Verification record

| Date | Code | Gate | Result | Evidence | Environment |
|---|---|---|---|---|---|
| YYYY-MM-DD | IMP-XXXX | Acceptance item | Pass / Fail / Not run | Exact output summary | Local / CI |

## Run handoff

| Field | Record |
|---|---|
| Date / code | YYYY-MM-DD · IMP-XXXX |
| Scope | Intended change |
| Changed | Actual behavior and files |
| Evidence | Exact commands and manual checks |
| Status | Planned / Partial / Implemented / ✅ Verified |
| Limits / next | Remaining constraint and next action |

End completed runs with an 8–18 word imperative commit sentence.
