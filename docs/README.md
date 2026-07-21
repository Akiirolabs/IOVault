# IO Vault Documentation

IO Vault is a signed-in productivity workspace with SQL-backed sync, offline browser caching, project documentation tools, and a GitHub-backed Code Vault mini IDE.

## Documentation map

| Area | Current source | Status |
|---|---|---|
| Platform architecture | [architecture.md](architecture.md) · [diagrams.md](diagrams.md) | Current |
| Server, auth, and persistence | [server-and-auth.md](server-and-auth.md) | Implemented; production hardening remains |
| Code Vault mini IDE | [code-vault-mini-ide.md](code-vault-mini-ide.md) · [code-vault-architecture.md](code-vault-architecture.md) | Implemented v1 |
| Project full-page editor | [project-page-editor.md](project-page-editor.md) | Implemented |
| Project table, flowchart, mindmap | [data-table-creator.md](data-table-creator.md) · [flowchart-node-map.md](flowchart-node-map.md) · [object-mindmap.md](object-mindmap.md) | Planned |
| Delivery history | [implementation-log.md](implementation-log.md) | Append-only summary |
| Priorities | [roadmap.md](roadmap.md) | Active |
| Security/debug evidence | [debug-system/](debug-system/README.md) | DBG-1001 and DBG-1002 verified |

## Current product boundaries

- `VaultState` is synced as one per-user SQLite JSON record and cached in localStorage.
- Authentication uses an HttpOnly SameSite session cookie; browser JavaScript never receives the JWT.
- Code Vault keeps repository files out of `VaultState`; IndexedDB caches working files and SQLite stores user-owned scratch files, patch sets, and GitHub metadata.
- General AI sends no vault context by default. Users can explicitly include a bounded summary of the active page.
- Code Vault AI receives only checked files and an optional explicitly enabled scratchpad.
- Code Vault proposes reviewable changes and draft pull requests; it does not execute code or provide a terminal.

## Documentation rule

After meaningful implementation work, update the relevant feature document, roadmap, implementation log, architecture/diagram if boundaries changed, and debug records when a DBG code is involved. Record only verified results.
