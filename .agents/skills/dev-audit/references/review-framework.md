# Product Experience Review Framework

Use this framework to make reviews complete, bounded, evidence-based, and sensitive to both major workflows and consequential details.

## Interaction inventory

For each affected workflow, inspect applicable states rather than assuming the happy path represents the feature.

| Surface | Inspect |
|---|---|
| Orientation | Entry point, purpose, hierarchy, labels, discoverability, next action |
| Core actions | Create, read, edit, delete, select, reorder, drag, resize, connect, expand |
| Control behavior | Hover, focus, press, disabled, keyboard, touch, menu placement, dismissal |
| Completion | Save, confirmation, progress, success, cancellation, undo, redo |
| Failure | Validation, timeout, offline, permission denial, conflict, retry, recovery |
| Data truth | Persistence, reload, synchronization, ownership, cloud-status accuracy |
| Content bounds | Empty, long, dense, oversized, truncated, scrolled, imported content |
| Accessibility | Focus order, visible focus, semantic names, screen-reader status, contrast, reduced motion |
| Responsive use | Narrow viewport, touch target, overlay fit, scroll containment, orientation change |
| Background work | Streaming, latency, continued tasks, cancellation, reconnect, stale state |
| Consequence | Confirmation, approval, reversibility, privacy, external side effects |

## Outcome review

Ask:

1. Can a new user understand what the surface is for and how to start?
2. Does the shortest common path avoid unnecessary choices and context switching?
3. Does every action produce immediate, accurate, proportionate feedback?
4. Can the user tell what changed, what is saved, what is still running, and what failed?
5. Can the user safely cancel, recover, undo, retry, or resume?
6. Does the workflow remain coherent across reloads, screen sizes, input methods, and realistic content?

## Detail review

Inspect labels, icon meaning, target size, focus, menu anchoring, outside-click and Escape behavior, scrolling, overflow, truncation, destructive-action treatment, duplicate controls, empty space, density, contrast, alignment, spacing, motion, and theme consistency.

Prefer direct manipulation, progressive disclosure, restrained motion, clear hierarchy, consistent patterns, and useful defaults. Treat aesthetics as functional when they affect comprehension, confidence, speed, accessibility, or error prevention.

## Evidence and severity

| Severity | Meaning |
|---|---|
| Critical | Security, privacy, irreversible data loss, or core application access failure |
| High | A primary workflow cannot complete, produces materially wrong results, or lacks safe recovery |
| Medium | The workflow completes but causes recurring confusion, friction, accessibility loss, or unreliable state |
| Low | Local polish or consistency issue with measurable but limited user impact |

Every finding must include:

- observed behavior and exact evidence;
- reproducible steps and affected state;
- expected behavior stated as an outcome, not a preferred implementation;
- user impact and severity rationale;
- FTR, SEC/DBG, SYS/DBG, or IMP routing;
- measurable acceptance criteria and verification method;
- dependencies, preservation constraints, and unknowns.

Do not convert taste into a defect. Do not hide a functional problem inside a cosmetic batch.

## DevCycle handoff

Provide DevCycle with raw artifacts, findings, acceptance criteria, affected work codes, preservation constraints, and unavailable evidence. Do not prescribe a patch unless the implementation constraint is itself required by product behavior or safety.

After implementation:

1. wait for objective gates and DevMind's independent diff review;
2. repeat the original reproduction and affected adjacent workflows;
3. exercise relevant normal, boundary, failure, persistence, accessibility, and responsive states;
4. classify each finding as resolved, unresolved, regressed, or unverified;
5. return failures to the next cycle without expanding scope beyond observed evidence.

The review loop uses DevCycle's iteration limit and hard stops. It never runs indefinitely and never treats unavailable verification as success.
