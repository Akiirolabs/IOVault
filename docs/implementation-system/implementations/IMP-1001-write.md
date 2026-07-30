# IMP-1001 — Notes / Write Workspace

**State:** Implemented v1 · **Priority:** P1

## Numbered implementation

| Code | Outcome | Review evidence | Status |
|---|---|---|---|
| `IMP-1001.1` | Workspace v1 | — | Implemented |
| &emsp;↳ `IMP-1001.1.1` | Migrate legacy Write HTML into a versioned first note | — | Implemented |
| &emsp;↳ `IMP-1001.1.2` | Rich-text page with title, metadata, **① formatting and insertion controls**, and explicit assistant context | [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) | Implemented |
| &emsp;&emsp;↳ `IMP-1001.1.2.1` | **①** Functional `+` formatting menu with a unified toolbar-area hover control and embedded-page availability | [FTR-1005](../../feature-review-system/reviews/FTR-1005-write-plus-menu-review.md) · [FTR-1006](../../feature-review-system/reviews/FTR-1006-write-toolbar-and-table-review.md) | Partial — FTR-1006 verified; advanced insertion remains planned |
| &emsp;↳ `IMP-1001.1.3` | Typed collections, nested rows, compact filters, sorting, embedded Page overlays, persisted column sizing, contextual row controls, individual status options, row highlighting, and **① advanced property workflows** | [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) · [FTR-1003](../../feature-review-system/reviews/FTR-1003-write-table-column-menu-review.md) · [FTR-1004](../../feature-review-system/reviews/FTR-1004-write-table-follow-up-review.md) · [FTR-1006](../../feature-review-system/reviews/FTR-1006-write-toolbar-and-table-review.md) | Implemented v1; expansion planned |
| &emsp;&emsp;↳ `IMP-1001.1.3.1` | **①** Advanced column editing, explicit sorting, keyboard traversal, embedded Page cells, Currency, Single select, Percent, Email, **② Formula**, and **③ Relation property contracts** | [FTR-1006](../../feature-review-system/reviews/FTR-1006-write-toolbar-and-table-review.md) · [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Implemented and verified |
| &emsp;&emsp;&emsp;↳ `IMP-1001.1.3.1.1` | **③** Select a source table, browse its records in an anchored foreground popup, and persist stable Relation values | [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Implemented and verified |
| &emsp;&emsp;&emsp;↳ `IMP-1001.1.3.1.2` | **②** Guided Formula authoring with bounded arithmetic and aggregate/rounding functions | [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Implemented and verified |
| &emsp;&emsp;↳ `IMP-1001.1.3.2` | Active-theme native horizontal scrollbar for navigating wide tables | [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Implemented and verified |
| &emsp;↳ `IMP-1001.1.4` | Repository-valid Testing Panel and reusable templates | [FTR-1002](../../feature-review-system/reviews/FTR-1002-write-actions-review.md) | Implemented |
| `IMP-1001.2` | Hierarchy and page actions | — | Implemented |
| &emsp;↳ `IMP-1001.2.1` | Collapsible page hierarchy with direct drag reordering and explicit parent controls | [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) · [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Implemented and verified |
| &emsp;↳ `IMP-1001.2.2` | Parent `•••` actions for page/table creation, CSV and supported-document import, rename, template, and delete | [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) · [FTR-1002](../../feature-review-system/reviews/FTR-1002-write-actions-review.md) · [FTR-1004](../../feature-review-system/reviews/FTR-1004-write-table-follow-up-review.md) | Implemented and verified |
| &emsp;↳ `IMP-1001.2.3` | Recoverable subtree archive and complete restoration | [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) | Implemented |
| &emsp;↳ `IMP-1001.2.4` | Expanded persisted page icons and action-menu behavior | [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) · [FTR-1002](../../feature-review-system/reviews/FTR-1002-write-actions-review.md) · [FTR-1004](../../feature-review-system/reviews/FTR-1004-write-table-follow-up-review.md) | Implemented and verified |
| &emsp;↳ `IMP-1001.2.5` | Slim glass Note, Table, and Testing Panel creation controls | [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Implemented and verified |
| `IMP-1001.3` | Cross-area record links | — | Planned |
| &emsp;↳ `IMP-1001.3.1` | Link Write records to Projects, Learning, Career, and Code Vault evidence | — | Planned |
| &emsp;↳ `IMP-1001.3.2` | Preserve links through account sync, archive, and recovery | — | Planned |

The Write workspace provides a focused knowledge environment built around navigable pages, structured content, typed collections, reusable templates, and controlled assistant context.

| Surface | Implemented v1 |
|---|---|
| Explorer | Collapsible and draggable hierarchy; keyboard moves; foreground `•••` actions; custom icons, rename, import, templates, subtree recovery, and search |
| Page | Title, 14 formatting controls, metadata, links, and explicit assistant context |
| Collection | Text, number, currency, percent, date, email, checkbox, single select/status, URL, embedded Page, Formula, and Relation columns; nested rows, filters, explicit sorting, keyboard traversal, and saved views |
| Templates | Repository-valid Testing Panel, blank top-level creation, reusable templates, and explicit add-new/replace-current choice |
| Connections | Active-page-only assistant context; cross-area record links remain planned |

## `IMP-1001.1–1001.3` delivery record

1. ✅ Added versioned page and collection contracts with text/checkbox properties and persisted view state.
2. ✅ Migrated existing `write.docHtml` into the first note without changing its HTML.
3. ✅ Added nested page lifecycle, search, rename, parent movement, subtree archive, and restore.
4. ✅ Added configurable tables with inline typed columns, rows, completion filtering, typed sorting, and the repository-valid Testing Panel.
5. Partial: explicit active-page assistant context and responsive table behavior are implemented; cross-area links and automated browser E2E remain.

**Evidence:** 27 tests passed, production build passed, and a signed-in browser smoke check confirmed Notes navigation, Testing Panel creation, four table rows, contained overflow, and zero console errors on 2026-07-22.

**Latest refinement:** 35 tests and the production build passed on 2026-07-24. A signed-in browser check confirmed the parent `•••` menu exposes Add page, Add table, Import, Rename, Save as template, and Delete without changing workspace data.

**FTR-1002 correction:** [FTR-1002](../../feature-review-system/reviews/FTR-1002-write-actions-review.md) is 6/6 verified. The foreground menu stays beside its trigger without selecting another page; icons persist, imports accept TXT/Markdown/CSV/JSON, and templates ask whether to add or replace.

**FTR-1003 correction:** [FTR-1003](../../feature-review-system/reviews/FTR-1003-write-table-column-menu-review.md) is 7/7 verified. Column and row actions now use target-specific contextual menus; subrow controls respond to hover, focus, and touch; row highlights persist; and destructive actions require confirmation. Verification: 46 tests, production build, authenticated persistence, and signed-in browser acceptance on 2026-07-26.

**FTR-1005 refinement:** [FTR-1005](../../feature-review-system/reviews/FTR-1005-write-plus-menu-review.md) is 3/4 verified. Supported formatting commands live in the note `+` menu and appear when the dedicated toolbar area is hovered; embedded Page content retains the same control, and the dropdown remains anchored in the foreground. Advanced insertion blocks remain open under `IMP-1001.1.2.1`.

**FTR-1006 correction:** [FTR-1006](../../feature-review-system/reviews/FTR-1006-write-toolbar-and-table-review.md) is 14/14 verified after corrected manual acceptance. The toolbar appears only over its control area, table editing advances by column on Enter, external paste retains useful formatting without source backgrounds or unsafe markup, linked-page controls remain sticky and dismiss on outside-click, Page content stays embedded in its collection cell, incomplete Formula cells expose guided configuration, and advanced column editing includes explicit sorting and functional Currency, Single select, Percent, Email, Formula, and Relation contracts.

**FTR-1007 correction:** [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) is 7/7 verified. Wide tables have themed horizontal navigation; Relation columns persist a selected source table and stable record ID through an anchored foreground picker; Formula supports guided arithmetic and bounded aggregate functions; explorer dragging reorders pages without silently changing hierarchy; and creation controls use a compact glass treatment. Verification: 50 tests, production build, and signed-in browser acceptance on 2026-07-30.

**TEST-IV-1001 completion:** [FTR-1001](../../feature-review-system/reviews/FTR-1001-write-manual-review.md) is 8/8 verified. Its corrections added page-section collapse, the expanded toolbar, linked Page cells, drag/keyboard organization, persistent rename coverage, and complete archive recovery. Verification: 44 tests, production build, and signed-in browser acceptance on 2026-07-25.

**Acceptance:** migration, hierarchy, collections, recoverable archive, and explicit assistant context are covered by model/component tests. Full status remains below `✅ Verified` until reload/account-sync and keyboard workflows have a durable browser E2E gate.

**Limits:** cross-area record links, additional templates, real-time collaboration, arbitrary third-party blocks, and full Notion parity are outside this v1.

## Corrective dependencies

SEC-1.0 and SYS-1.0 own evidence and corrections outside this product implementation.

| Record | Correction | Completion gate |
|---|---|---|
| ✅ [DBG-1017](../../audit-system/SYS-1.0-system-baseline.md#dbg-1017--typed-table-column-behavior) | Replaced browser prompts with inline creation, rename/type editing, select options, and six typed cell controls | Passed 2026-07-23 |
| [DBG-1007/1008](../../audit-system/SYS-1.0-system-baseline.md) | Normalize collection data and make persistence/conflict handling durable | Component and signed-in browser E2E cover the complete collection lifecycle |
| [DBG-1011](../../audit-system/SEC-1.0-security-baseline.md#dbg-1011--rich-text-sanitization) | Sanitize stored HTML and finish safe editor behavior | Sanitization, formatting, focus, and keyboard tests pass with the production build |
| ✅ [FTR-1003](../../feature-review-system/reviews/FTR-1003-write-table-column-menu-review.md) | Added target-specific column and row menus, persisted row highlighting, contextual subrow controls, and confirmed deletion | Passed 2026-07-26 |
| [FTR-1004](../../feature-review-system/reviews/FTR-1004-write-table-follow-up-review.md) | Linked-page overlays, consolidated foreground row actions, persisted column sizing, expanded icons/imports, individual status options, and compact filters | Verified — 11/11 on 2026-07-28 |
| [FTR-1005](../../feature-review-system/reviews/FTR-1005-write-plus-menu-review.md) | Complete the functional note insertion catalog beyond the verified toolbar and menu foundation | Partial — 3/4 verified on 2026-07-27 |
| ✅ [FTR-1006](../../feature-review-system/reviews/FTR-1006-write-toolbar-and-table-review.md) | Corrected toolbar activation, normalized external paste, table keyboard behavior, dismissible sticky linked-page controls, embedded Page cells, guided Formula setup, and advanced column workflows | Passed — 14/14 on 2026-07-29 |
| ✅ [FTR-1007](../../feature-review-system/reviews/FTR-1007-write-table-and-navigation-review.md) | Added themed wide-table navigation, record-based relations, advanced Formula authoring, explorer reordering, and refined creation controls | Passed — 7/7 on 2026-07-30 |

DBG-1017 is verified. Persistence/sync and rich-text findings remain Open in their owning audit lanes. Rapid reload before the current 800 ms server-sync window remains part of SYS-1.0.

The [FTR-1001 manual review](../../feature-review-system/reviews/FTR-1001-write-manual-review.md), sourced from `TEST-IV-1001`, owns all eight verified findings and corrections.

## Engineering dependencies

Workspace growth, conflict-safe sync, frontend boundaries, and rich-text safety are linked through the consolidated [implementation index](../README.md).
