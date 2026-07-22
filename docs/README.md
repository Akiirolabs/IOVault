# IO Vault Documentation

IO Vault is a signed-in productivity workspace with SQL-backed sync, offline browser caching, project documentation tools, and a GitHub-backed Code Vault mini IDE.

## Documentation map

| Area | Current source | Status |
|---|---|---|
| Platform architecture | [architecture.md](architecture.md) · [diagrams.md](diagrams.md) | Legacy maps preserved; current implementation maps appended |
| Server, auth, and persistence | [server-and-auth.md](server-and-auth.md) | Implemented; production hardening remains |
| Code Vault mini IDE | [code-vault-mini-ide.md](code-vault-mini-ide.md) · [code-vault-architecture.md](code-vault-architecture.md) | Implemented v1 |
| Project full-page editor | [project-page-editor.md](project-page-editor.md) | Implemented |
| Notes / Write workspace | [implementation-system area plan](implementation-system/areas/IMP-1003-notes-write.md) | Implemented v1 |
| Project table, flowchart, mindmap | [data-table-creator.md](data-table-creator.md) · [flowchart-node-map.md](flowchart-node-map.md) · [object-mindmap.md](object-mindmap.md) | Planned |
| Product implementation system | [implementation-system/](implementation-system/README.md) | Active plans and verification gates |
| Delivery history | [implementation-log.md](implementation-log.md) | Append-only summary |
| Priorities | [roadmap.md](roadmap.md) | Active |
| Security/debug evidence | [debug-system/](debug-system/README.md) | DBG-1001 through DBG-1003 verified |

## Current product boundaries

- `VaultState` is synced as one per-user SQLite JSON record and cached in localStorage.
- Authentication uses an HttpOnly SameSite session cookie; browser JavaScript never receives the JWT.
- Code Vault keeps repository files out of `VaultState`; IndexedDB caches working files and SQLite stores user-owned scratch files, patch sets, and GitHub metadata.
- General AI sends no vault context by default. Users can explicitly include a bounded summary of the active page.
- Notes uses a versioned page/collection model inside `VaultState`; legacy Write HTML becomes the first note, and only the active note or collection is eligible for explicit AI context.
- Code Vault AI receives only checked files and an optional explicitly enabled scratchpad.
- Code Vault proposes reviewable changes and draft pull requests; it does not execute code or provide a terminal.

## Documentation rule

After meaningful implementation work, update the relevant feature document, [implementation system](implementation-system/README.md), roadmap, implementation log, architecture/diagram if boundaries changed, and debug records when a DBG code is involved. Record only verified results.
