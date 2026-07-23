# Work Code Ledger

This is the compact cross-system index. Detailed scope and evidence remain in the linked authoritative records.

## Legend

| Prefix | Meaning | Used for |
|---|---|---|
| `IMP` | Implementation | Product features and experience work |
| `DBG` | Debug | Confirmed defects, risks, and technical debt |
| `DOC` | Documentation | Documentation-only organization or clarification |
| `DPL` | Deployment | Release, hosting, environment, and production readiness |
| `ADT` | Audit | Evidence-based review that identifies gaps without fixing them |
| `DBG-IMP` | Debug Implementation | Remediation run performed after an audit or confirmed DBG finding |

Each series starts at `1001`. Preserve an existing code once assigned. Use `—` when work has not started or no reliable date exists.

## Implementation

| Code | Status | Problem · recorded | Fix or outcome · finished |
|---|---|---|---|
| IMP-1001 | Implemented | Base shell needed responsive parity · 2026-07-03 | Preserved desktop workspace on narrow screens · 2026-07-03 |
| [IMP-1002](implementation-system/areas/IMP-1002-code-vault.md) | Implemented v1 | Code Vault lacked an assisted repository workflow · 2026-07 | Added Monaco, scratch files, reviewed patches, and draft PRs · 2026-07 |
| [IMP-1003](implementation-system/areas/IMP-1003-notes-write.md) | Implemented v1 · 1/3 corrections verified | Write lacked structured notes and collections · 2026-07-21 | Added hierarchy, tables, archive, Testing Panel, and AI context · 2026-07-22 |
| [IMP-1004](implementation-system/areas/IMP-1004-projects.md) | Partial | Projects need structured work modes · 2026-07-21 | Full-page editor done; typed table and graphs pending · — |
| [IMP-1005](implementation-system/areas/IMP-1005-learning.md) | Partial | Learning workflow needs structured records · 2026-07-21 | Design and implementation pending · — |
| [IMP-1006](implementation-system/areas/IMP-1006-career.md) | Partial | Career workflow needs evidence and application tracking · 2026-07-21 | Design and implementation pending · — |
| [IMP-1007](implementation-system/areas/IMP-1007-ui-navigation.md) | Partial | Shared workspace patterns are inconsistent · 2026-07-21 | Standard patterns and acceptance pending · — |

## Debug

| Code | Status | Problem · confirmed | Fix · finished |
|---|---|---|---|
| [DBG-1001](debug-system/issues/DBG-1001-unauthenticated-ai-endpoint.md) | ✅ Verified | AI endpoint allowed anonymous use · 2026-07-19 | Added auth, limits, timeout, safe errors, and audit · 2026-07-19 |
| [DBG-1002](debug-system/issues/DBG-1002-entire-vault-sent-to-openai.md) | ✅ Verified | General AI sent the full vault · 2026-07-19 | Defaulted to no context and bounded explicit page context · 2026-07-20 |
| [DBG-1003](debug-system/issues/DBG-1003-jwt-localstorage.md) | ✅ Verified | Browser storage exposed the JWT · 2026-07-19 | Replaced it with HttpOnly cookie sessions and CSRF protection · 2026-07-21 |
| [DBG-1004](debug-system/issues/DBG-1004-jwt-secret-fallback.md) | Confirmed | Production can use a predictable JWT fallback · 2026-07-19 | Pending fail-closed production validation · — |
| [DBG-1005](debug-system/issues/DBG-1005-rate-limiting.md) | Planned | System-wide abuse controls are incomplete · 2026-07-19 | Pending route quotas and shared counters · — |
| [DBG-1006](debug-system/issues/DBG-1006-workspace-json-blob.md) | Confirmed | One JSON blob limits scale and ownership · 2026-07-19 | Pending incremental record normalization · — |
| [DBG-1007](debug-system/issues/DBG-1007-sync-conflicts.md) | Confirmed | Last-write-wins can overwrite newer work · 2026-07-19 | Pending version checks and conflict UX · — |
| [DBG-1008](debug-system/issues/DBG-1008-app-component-monolith.md) | Confirmed | Frontend responsibilities remain concentrated · 2026-07-19 | Pending characterization and incremental extraction · — |
| [DBG-1009](debug-system/issues/DBG-1009-server-monolith.md) | Confirmed | Server routes and services remain concentrated · 2026-07-19 | Pending domain router and service extraction · — |
| [DBG-1010](debug-system/issues/DBG-1010-rich-text-sanitization.md) | Partial | Rich HTML sinks can store unsafe content · 2026-07-19 | Pending complete sink trace and allowlist sanitization · — |
| [DBG-1011](debug-system/issues/DBG-1011-input-validation.md) | Partial | API validation is inconsistent · 2026-07-19 | Pending shared boundary schemas · — |
| [DBG-1012](debug-system/issues/DBG-1012-dependency-pinning.md) | Confirmed | Dependency ranges can drift unexpectedly · 2026-07-19 | Pending pinning and automated update gates · — |
| [DBG-1013](debug-system/issues/DBG-1013-package-separation.md) | Confirmed | One package couples unrelated boundaries · 2026-07-19 | Deferred until stable module boundaries exist · — |
| [DBG-1014](debug-system/issues/DBG-1014-monaco-and-react-state.md) | Partial | Editor state may create memory pressure · 2026-07-19 | Pending realistic profiling and bounded ownership · — |

## Debug implementations

| Code | Related finding | Status | Problem · started | Fix · finished |
|---|---|---|---|---|
| DBG-IMP-1001 | DBG-1001 | ✅ Verified | Anonymous AI access · 2026-07-19 | Secured and bounded `/api/agent` · 2026-07-19 |
| DBG-IMP-1002 | DBG-1002 | ✅ Verified | Excessive AI context · 2026-07-20 | Limited context to explicit bounded page data · 2026-07-20 |
| DBG-IMP-1003 | DBG-1003 | ✅ Verified | Browser-held bearer token · 2026-07-21 | Added cookie session, CSRF, and logout clearing · 2026-07-21 |
| DBG-IMP-1004 | ADT-1001 · IMP-1003 · DBG-1011 | ✅ Verified | Column creation and type selection were incomplete · 2026-07-23 | Added inline text, number, date, checkbox, select/status, and URL controls · 2026-07-23 |
| DBG-IMP-1005 | ADT-1001 · IMP-1003 · DBG-1006/1007 | Planned | Collection behavior and persistence lack complete coverage · 2026-07-23 | Normalize data; correct filters, sorting, restore, sync, and durable E2E · — |
| DBG-IMP-1006 | ADT-1001 · IMP-1003 · DBG-1010 | Planned | Rich text and keyboard behavior remain unsafe or incomplete · 2026-07-23 | Sanitize HTML, replace fragile editing commands, and add accessibility tests · — |

## Documentation

| Code | Status | Problem · started | Fix or outcome · finished |
|---|---|---|---|
| DOC-1001 | Complete | Repository lacked a documentation baseline · 2026-07-03 | Added initial architecture, diagrams, roadmap, and history · 2026-07-03 |
| DOC-1002 | Complete | Product improvements lacked a tracking system · 2026-07-21 | Added implementation plans, register, gates, and templates · 2026-07-21 |
| DOC-1003 | Complete | Architecture maps mixed historical and current states · 2026-07-21 | Preserved legacy maps and added current direction · 2026-07-21 |
| DOC-1004 | Complete | IMP and DBG details overlapped · 2026-07-21 | Separated product design from engineering remediation · 2026-07-21 |
| DOC-1005 | Complete | Documentation had duplicate status and planning files · 2026-07-23 | Consolidated authoritative records and removed mirrors · 2026-07-23 |
| DOC-1006 | Complete | Generated diagram copies duplicated Mermaid sources · 2026-07-23 | Retained editable Mermaid only · 2026-07-23 |
| DOC-1007 | Complete | Work prefixes and cross-system history lacked one index · 2026-07-23 | Added this correlated code ledger · 2026-07-23 |
| DOC-1008 | Complete | ADT-1001 lacked an ordered correction path · 2026-07-23 | Added DBG-IMP-1004 through 1006 and synchronized IMP-1003 planning · 2026-07-23 |

## Deployment

| Code | Status | Problem · recorded | Fix · finished |
|---|---|---|---|
| DPL-1001 | Planned | Production startup can accept a fallback JWT secret · 2026-07-19 | Pending fail-closed environment validation; see DBG-1004 · — |

## Audits

| Code | Scope | Status | Problem · found | Fix · finished |
|---|---|---|---|---|
| ADT-1001 | IMP-1003 Notes / Write | Complete | Column creation failed in the in-app browser; typed controls and core tests were incomplete · 2026-07-23 | DBG-IMP-1004 verified; DBG-IMP-1005 and 1006 pending · — |

## Update rule

After every repository run, add or update the applicable row. An audit records findings under `ADT`; a defect receives a `DBG`; its later remediation receives a correlated `DBG-IMP`. Never add a finish date until the stated verification passes.
