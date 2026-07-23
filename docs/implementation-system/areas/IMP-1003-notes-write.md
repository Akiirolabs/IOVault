# IMP-1003 — Notes / Write Workspace

**State:** Implemented v1 · **Priority:** P1

The screenshot establishes the product direction: a focused knowledge workspace with a navigable hierarchy, page content, and structured table views. IO Vault should reuse that interaction pattern without copying the source product’s branding.

| Surface | Implemented v1 |
|---|---|
| Explorer | Nested pages and collections with create, rename, parent selection, archive/restore, and search |
| Page | Title, rich content, metadata, links, and explicit assistant context |
| Collection | Inline text, number, date, checkbox, select/status, and URL columns; rows, completion filters, typed sorting, and saved views |
| Templates | Repository-valid Testing Panel plus blank note and table creation |
| Connections | Active-page-only assistant context; cross-area record links remain planned |

## Steps

1. ✅ Added versioned page and collection contracts with text/checkbox properties and persisted view state.
2. ✅ Migrated existing `write.docHtml` into the first note without changing its HTML.
3. ✅ Added nested page lifecycle, search, rename, parent movement, subtree archive, and restore.
4. ✅ Added configurable tables with inline typed columns, rows, completion filtering, typed sorting, and the repository-valid Testing Panel.
5. Partial: explicit active-page assistant context and responsive table behavior are implemented; cross-area links and automated browser E2E remain.

**Evidence:** 27 tests passed, production build passed, and a signed-in browser smoke check confirmed Notes navigation, Testing Panel creation, four table rows, contained overflow, and zero console errors on 2026-07-22.

**Acceptance:** migration, hierarchy, collections, recoverable archive, and explicit assistant context are covered by model/component tests. Full status remains below `✅ Verified` until reload/account-sync and keyboard workflows have a durable browser E2E gate.

**Limits:** cross-area record links, additional templates, real-time collaboration, arbitrary third-party blocks, and full Notion parity are outside this v1.

## Audit correction sequence

ADT-1001 found that the v1 table and editor do not yet satisfy complete browser, typing, persistence, safety, and keyboard acceptance.

| Run | Correction | Completion gate |
|---|---|---|
| ✅ DBG-IMP-1004 | Replaced browser prompts with inline creation, rename/type editing, select options, and six typed cell controls | 30 tests, build, and signed-in create/edit/save/reload browser acceptance passed 2026-07-23 |
| DBG-IMP-1005 | Normalize collection data and correct sorting, completion filters, subtree restore, sync, and recovery | Component and signed-in browser E2E cover the complete collection lifecycle |
| DBG-IMP-1006 | Sanitize stored HTML, replace fragile rich-text commands, and finish keyboard/accessibility behavior | Sanitization, formatting, focus, and keyboard tests pass with the production build |

DBG-IMP-1004 is verified. DBG-IMP-1005 and 1006 remain planned with blank finish dates in the [work-code ledger](../../work-code-ledger.md). Rapid reload before the current 800 ms server-sync window remains part of DBG-IMP-1005.

## Engineering dependencies

Workspace growth, conflict-safe sync, frontend boundaries, and rich-text safety are owned by [DBG-1006, DBG-1007, DBG-1008, and DBG-1010](../engineering-dependencies.md).
