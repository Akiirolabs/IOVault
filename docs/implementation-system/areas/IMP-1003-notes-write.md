# IMP-1003 — Notes / Write Workspace

**State:** Implemented v1 · **Priority:** P1

The screenshot establishes the product direction: a focused knowledge workspace with a navigable hierarchy, page content, and structured table views. IO Vault should reuse that interaction pattern without copying the source product’s branding.

| Surface | Implemented v1 |
|---|---|
| Explorer | Nested pages and collections with create, rename, parent selection, archive/restore, and search |
| Page | Title, rich content, metadata, links, and explicit assistant context |
| Collection | Configurable columns, rows, filters, sorting, saved views, and completion states |
| Templates | Repository-valid Testing Panel plus blank note and table creation |
| Connections | Active-page-only assistant context; cross-area record links remain planned |

## Steps

1. ✅ Added versioned page and collection contracts with text/checkbox properties and persisted view state.
2. ✅ Migrated existing `write.docHtml` into the first note without changing its HTML.
3. ✅ Added nested page lifecycle, search, rename, parent movement, subtree archive, and restore.
4. ✅ Added configurable tables with rows, columns, filtering, sorting, and the repository-valid Testing Panel.
5. Partial: explicit active-page assistant context and responsive table behavior are implemented; cross-area links and automated browser E2E remain.

**Evidence:** 27 tests passed, production build passed, and a signed-in browser smoke check confirmed Notes navigation, Testing Panel creation, four table rows, contained overflow, and zero console errors on 2026-07-22.

**Acceptance:** migration, hierarchy, collections, recoverable archive, and explicit assistant context are covered by model/component tests. Full status remains below `✅ Verified` until reload/account-sync and keyboard workflows have a durable browser E2E gate.

**Limits:** cross-area record links, additional templates, real-time collaboration, arbitrary third-party blocks, and full Notion parity are outside this v1.

## Engineering dependencies

Workspace growth, conflict-safe sync, frontend boundaries, and rich-text safety are owned by [DBG-1006, DBG-1007, DBG-1008, and DBG-1010](../engineering-dependencies.md).
