# Work-System Ledger

Central index only; linked records own scope and evidence. Dates are `YYYY-MM-DD`; `—` means not started or not verified.

## Implementation

| Code | Page | Status | Current rollout |
|---|---|---|---|
| [IMP-1001](../implementation-system/areas/IMP-1001-notes-write.md) | Write | Implemented v1 | Hierarchy/actions complete; cross-area links planned |
| [IMP-1002](../implementation-system/areas/IMP-1002-code-vault.md) | Code Vault | Implemented v1 | Repository workflow refinement planned |
| [IMP-1003](../implementation-system/areas/IMP-1003-projects.md) | Projects | Partial | Typed table, flowchart, and mindmap planned |
| [IMP-1004](../implementation-system/areas/IMP-1004-learning.md) | Learning / Mentor | Partial | Mentor Agent planned |
| [IMP-1005](../implementation-system/areas/IMP-1005-career.md) | Career | Partial | Career Agent planned |

## Debug

| Code | Status | Problem · discovered | Resolution · finished |
|---|---|---|---|
| [DBG-1001](../debug-system/issues/DBG-1001-unauthenticated-ai-endpoint.md) | Verified | Anonymous AI access · 2026-07-19 | Auth, bounds, limits, timeout, audit · 2026-07-19 |
| [DBG-1002](../debug-system/issues/DBG-1002-entire-vault-sent-to-openai.md) | Verified | Excessive AI context · 2026-07-19 | Explicit bounded context · 2026-07-20 |
| [DBG-1003](../debug-system/issues/DBG-1003-jwt-localstorage.md) | Verified | Browser-held JWT · 2026-07-19 | Cookie session and CSRF protection · 2026-07-21 |
| [DBG-1004](../debug-system/issues/DBG-1004-jwt-secret-fallback.md) | Planned | Predictable production secret fallback · 2026-07-19 | — |
| [DBG-1005](../debug-system/issues/DBG-1005-rate-limiting.md) | Planned | Incomplete shared abuse controls · 2026-07-19 | — |
| [DBG-1006](../debug-system/issues/DBG-1006-workspace-json-blob.md) | Planned | Monolithic workspace storage · 2026-07-19 | — |
| [DBG-1007](../debug-system/issues/DBG-1007-sync-conflicts.md) | Planned | Last-write-wins conflicts · 2026-07-19 | — |
| [DBG-1008](../debug-system/issues/DBG-1008-app-component-monolith.md) | Planned | Frontend monolith · 2026-07-19 | — |
| [DBG-1009](../debug-system/issues/DBG-1009-server-monolith.md) | Planned | Server monolith · 2026-07-19 | — |
| [DBG-1010](../debug-system/issues/DBG-1010-rich-text-sanitization.md) | Planned | Unsafe rich-text boundary · 2026-07-19 | — |
| [DBG-1011](../debug-system/issues/DBG-1011-input-validation.md) | Planned | Inconsistent API validation · 2026-07-19 | — |
| [DBG-1012](../debug-system/issues/DBG-1012-dependency-pinning.md) | Planned | Dependency drift · 2026-07-19 | — |
| [DBG-1013](../debug-system/issues/DBG-1013-package-separation.md) | Planned | Coupled package boundaries · 2026-07-19 | — |
| [DBG-1014](../debug-system/issues/DBG-1014-monaco-and-react-state.md) | Planned | Unprofiled editor memory pressure · 2026-07-19 | — |
| [DBG-1015](../debug-system/issues/DBG-1015-responsive-shell.md) | Verified | Shell lacked narrow-screen parity · 2026-07-03 | Responsive workspace correction · 2026-07-03 |
| [DBG-1016](../debug-system/issues/DBG-1016-shared-ui-navigation.md) | Planned | Shared navigation patterns are inconsistent · 2026-07-21 | — |

## Debug implementations

| Code | Source | Status | Outcome · finished |
|---|---|---|---|
| DBG-IMP-1001 | DBG-1001 | Verified | Secured and bounded `/api/agent` · 2026-07-19 |
| DBG-IMP-1002 | DBG-1002 | Verified | Limited AI context · 2026-07-20 |
| DBG-IMP-1003 | DBG-1003 | Verified | Added cookie auth and CSRF protection · 2026-07-21 |
| DBG-IMP-1004 | ADT-1001 | Verified | Added six typed column controls · 2026-07-23 |
| DBG-IMP-1005 | ADT-1001 | Planned | Collection integrity and persistence · — |
| DBG-IMP-1006 | ADT-1001 | Planned | Safe rich text and keyboard accessibility · — |
| DBG-IMP-1011 | DBG-1015 | Verified | Corrected responsive shell behavior · 2026-07-03 |

## Audits

| Code | Scope | Status | Result |
|---|---|---|---|
| [ADT-1001](../audit-system/records/ADT-1001-write-code-audit.md) | Write code and behavior | Complete | DBG-IMP-1004 verified; 1005–1006 planned |

## Feature reviews

| Code | Source | Status | Result |
|---|---|---|---|
| [FTR-1001](../feature-review-system/reviews/FTR-1001-write-page-manual-review.md) | `TEST-IV-1001` | Complete · 8/8 | FTR-IMP-1001, 1002, and 1004 verified |
| [FTR-1002](../feature-review-system/reviews/FTR-1002-write-page-actions.md) | Manual Write review | Complete · 6/6 | FTR-IMP-1003 verified |

## Feature-review implementations

| Code | Source | Status | Outcome · finished |
|---|---|---|---|
| FTR-IMP-1001 | FTR-1001.1 | Verified | Added nested rows and collapse controls · 2026-07-24 |
| FTR-IMP-1002 | FTR-1001.2 | Verified | Added recoverable deletion · 2026-07-24 |
| FTR-IMP-1003 | FTR-1002.1–1002.6 | Verified | Corrected page-menu behavior · 2026-07-24 |
| FTR-IMP-1004 | FTR-1001.3–1001.7 | Verified | Completed remaining Write findings · 2026-07-25 |

## Documentation

| Code | Status | Outcome · finished |
|---|---|---|
| DOC-1001–DOC-1011 | Complete | Documentation baseline through agent redesign · 2026-07-03–2026-07-24 |
| DOC-1012 | Complete | Migrated work taxonomy and authoritative records · 2026-07-25 |

## Deployment

| Code | Status | Scope |
|---|---|---|
| [DPL-1001](../deployment-system/DPL-1001-production-release.md) | Planned | First complete production release |

## Update rule

Route work using [README.md](README.md). Only `IMP` accepts speculative roadmap work. Findings must exist before creating `DBG`, `ADT`, or `FTR`; fixes use `DBG-IMP` or `FTR-IMP`. Documentation-only runs use `DOC`; complete production releases use `DPL`.
