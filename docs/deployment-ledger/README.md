# Deployment Ledger

DPL is IO Vault’s single chronological ledger. A deployment is a complete architecture released for testing; a Version is the intentionally assigned product identity.

```mermaid
flowchart LR
  DPL1["DPL baseline"] --> IMP["IMP product work"]
  IMP --> Review["FTR, SEC, and SYS evidence"]
  Review --> Fix["Corrections in the originating record"]
  Fix --> Verify["Complete-state verification"]
  Verify --> DPL2["Next DPL"]
  DPL2 -. "cycle repeats" .-> IMP
```

## Chronology

| Date | State/work | Result | Flows into |
|---|---|---|---|
| 2026-07-10 | [DPL-1001](DPL-1001-pre-monaco-state.md) | Pre-Monaco baseline at `1ca6534` | IMP-1001–1005 |
| 2026-07-15 | IMP-1002.1 | Monaco mini IDE and reviewed GitHub patch workflow | DPL-1002 |
| 2026-07-19–21 | SEC DBG-1002–1004 | AI authentication/privacy and browser sessions verified | DPL-1002 |
| 2026-07-22 | IMP-1001.1 | Structured Write pages, collections, migration, explicit AI context | DPL-1002 |
| 2026-07-23 | SYS DBG-1017 | Typed table columns verified | DPL-1002 |
| 2026-07-24–25 | FTR-1001/1002 | Manual Write findings corrected and verified | DPL-1002 |
| 2026-07-25 | [DPL-1002](DPL-1002-current-testing-state.md) | Post-Monaco testing state established at `73d45ac`; Version 1.0 | Active testing state |
| 2026-07-26 | [FTR-1003](../feature-review-system/reviews/FTR-1003-write-table-column-menu-review.md) | Write table menus, contextual subrow controls, persisted highlighting, and confirmed deletion verified with 46 tests and the production build | DPL-1002 active state |
| 2026-07-27–28 | [FTR-1004](../feature-review-system/reviews/FTR-1004-write-table-follow-up-review.md) / [FTR-1005](../feature-review-system/reviews/FTR-1005-write-plus-menu-review.md) | Table follow-up completed with linked-page overlays, foreground row controls, persisted resizing, expanded icons/imports, individual status options, and compact filters; note insertion remains partial | DPL-1002 active state; remaining FTR-1005 scope flows to DPL-1003 |
| 2026-07-29 | [FTR-1006](../feature-review-system/reviews/FTR-1006-write-toolbar-and-table-review.md) | Corrected toolbar activation, external paste normalization, linked-page dismissal, embedded Page ownership, table behavior, and advanced property workflows completed | DPL-1002 current testing state |
| 2026-07-29 | [IMP-1006](../implementation-system/implementations/IMP-1006-settings.md) | Settings page and persisted Theme Mode implemented without replacing IO Vault’s animated visual system | DPL-1002 current testing state |
| 2026-07-30 | [FTR-1007](../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Themed table navigation, stable record relations, guided Formula functions, direct explorer reordering, and compact creation controls verified with 50 tests, the production build, and signed-in browser acceptance | DPL-1002 current testing state |
| 2026-07-30 | [FTR-1008](../feature-review-system/reviews/FTR-1008-projects-page-review.md) | Projects deletion, reordering, full-page mode creation, contextual actions, and status-filter findings recorded | IMP-1003.2-1003.5 implementation below |
| 2026-07-30 | [IMP-1003.2-1003.5](../implementation-system/implementations/IMP-1003-projects.md) / [FTR-1008](../feature-review-system/reviews/FTR-1008-projects-page-review.md) | Typed tables, visual Flowchart/Mindmap canvases with direct arrows and independent ⚡ Mindmap node pages, front-card actions, persisted drag ordering, and status filters verified with 56 tests, the production build, and signed-in browser acceptance | DPL-1002 current testing state |
| 2026-07-30 | [FTR-1009](../feature-review-system/reviews/FTR-1009-projects-follow-up-review.md) / [FTR-1010](../feature-review-system/reviews/FTR-1010-global-ai-chat-review.md) | Projects gained dismissible full pages, project-only AI context, live movable and resizable nodes, position-aware ordering, sorting, and templates; the global assistant gained persistent conversations, history switching, compact sending, and explicit context management | Both reviews verified in DPL-1002 |
| 2026-07-31 | [IMP-1004](../implementation-system/implementations/IMP-1004-learning-mentor.md) / [IMP-1005](../implementation-system/implementations/IMP-1005-career.md) | Shared durable agent runtime, migrated profiles, minimal text/voice orb workspaces, review-first approvals, internal learning/career records, encrypted Google adapter, and responsive agent layout implemented and verified locally | Partial agent foundation included in DPL-1002; remaining complete workflows and external connector acceptance flow to DPL-1003 |
| 2026-08-01 | [DPL-1002](DPL-1002-current-testing-state.md) | Approved `app.akiiro.com` routing through Cloudflare to the existing Hetzner-hosted application architecture | Deployment checklist remains open; no production claim |
| 2026-08-01 | [FTR-1011](../feature-review-system/reviews/FTR-1011-agent-conversation-and-voice-review.md) | Verified continuous transcripts, conversational tone, left-side placement, cloud-save feedback, and non-looping voice controls | Included in DPL-1002; remaining Mentor and Career workflows continue toward DPL-1003 |
| 2026-08-01 | [FTR-1012](../feature-review-system/reviews/FTR-1012-projects-content-and-layout-review.md) | Verified contained project scrolling, shared card/full-page content, Markdown mini views, compact table controls, and persisted graph descriptions | Included in DPL-1002 and removed from DPL-1003 planned scope |
| 2026-08-11 | [IMP-1003](../implementation-system/implementations/IMP-1003-projects.md) / [SYS-1.0 DBG-1007/1008](../audit-system/SYS-1.0-system-baseline.md) | Verified bounded Projects uploads, ordered saves, truthful local-only/cache-failure states, protected sign-out, and reload-safe user-scoped recovery; dedicated records and server-side conflict versions remain open | DPL-1002 current testing state |
| — | [DPL-1003](DPL-1003-next-testing-state.md) | Planned next complete testing state | Not deployed |

Open SEC/SYS findings are accepted testing limitations, not production-readiness evidence.

## Version register

| Version | DPL | Status | Date | Meaning |
|---|---|---|---|---|
| 1.0 | [DPL-1002](DPL-1002-current-testing-state.md) | Current | 2026-07-28 | Current product identity in the documented testing state |

A later testing DPL does not automatically change the Version. The package manifest’s `0.1.0` is build metadata, not the product Version authority.

## Authority and routing

| Record | Responsibility |
|---|---|
| DPL | Historical, current, or planned complete testing state |
| IMP | Page-level product outcomes flowing toward the next DPL |
| EDEP | External services, credentials, consent, partnerships, or hosted-runtime prerequisites subordinate to one IMP |
| FTR | Manual feature findings and their corrections |
| SEC/SYS | Versioned security and system audit lanes |
| DBG | Individual evidence, correction, status, and verification inside one audit lane |

Only DPL and IMP describe future product outcomes. EDEP records external prerequisites and verification gates without owning product scope. Documentation-only maintenance receives no work code.

## Historical aliases

Former identifiers remain here only for searchability; Git history preserves their original files.

| Former authority/code | Current owner |
|---|---|
| `work-system/ledger.md`, `implementation-log.md`, `deployment-system/` | Deployment Ledger |
| `debug-system/` and `ADT-1001` | SEC-1.0 or SYS-1.0 |
| `DOC-*` | Retired; no code for documentation maintenance |
| `DBG-IMP-*` | Owning DBG |
| `FTR-IMP-*` | Owning FTR |
| Former `DBG-1015` responsive shell | DBG-1001 |
| Former DBG-1001 through DBG-1014 | Current DBG-1002 through DBG-1015, in order |
| Former DBG-1016 | DBG-1016 |
| `ADT-1001` / `DBG-IMP-1004` typed columns | DBG-1017 |
| Former IMP-1003 Write | IMP-1001 |
| Former IMP-1002 Code Vault | IMP-1002 |
| Former IMP-1004 Projects | IMP-1003 |
| Former IMP-1005 Learning | IMP-1004 |
| Legacy IMP-1006 Career | IMP-1005; retired Career alias predates the current IMP-1006 Settings assignment |

Former DBG-IMP-1001/1002/1003 map to DBG-1002/1003/1004; DBG-IMP-1005 maps to DBG-1007/1008; DBG-IMP-1006 maps to DBG-1011; DBG-IMP-1011 maps to DBG-1001. Former FTR-IMP-1001, 1002, and 1004 map to FTR-1001; FTR-IMP-1003 maps to FTR-1002. Historical aliases remain explicitly labeled so they cannot be mistaken for current work codes.
