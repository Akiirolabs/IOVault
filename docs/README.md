# IO Vault Documentation

IO Vault is a signed-in productivity workspace with SQL-backed sync, offline browser caching, project documentation tools, and a GitHub-backed Code Vault mini IDE.

## Documentation map

| Area | Current source | Status |
|---|---|---|
| Platform architecture and diagrams | [architecture.md](architecture.md) | Current boundaries, target direction, and preserved legacy maps |
| Server, auth, and persistence | [server-and-auth.md](server-and-auth.md) | Implemented; production hardening remains |
| Code Vault mini IDE | [code-vault-mini-ide.md](code-vault-mini-ide.md) · [code-vault-architecture.md](code-vault-architecture.md) | Implemented v1 |
| Notes / Write workspace | [implementation-system area plan](implementation-system/areas/IMP-1001-notes-write.md) | Implemented v1 |
| Projects editor, table, flowchart, mindmap | [Projects area plan](implementation-system/areas/IMP-1003-projects.md) | Editor implemented; remaining modes planned |
| Mentor Agent | [Learning area plan](implementation-system/areas/IMP-1004-learning.md) | Conversational teaching and autonomous learning workflow planned |
| Career Agent | [Career area plan](implementation-system/areas/IMP-1005-career.md) | Resume-based job discovery, reviewed applications, and bounded autopilot planned |
| Product implementation system | [implementation-system/](implementation-system/README.md) | Active plans and verification gates |
| Work-system authority | [work-system/](work-system/README.md) · [ledger](work-system/ledger.md) | Eight-category taxonomy, aliases, templates, and index |
| Code and architecture audits | [audit-system/](audit-system/README.md) | ADT evidence and correction links |
| Manual feature reviews | [feature-review-system/](feature-review-system/README.md) | FTR findings and FTR-IMP corrections |
| Production releases | [deployment-system/](deployment-system/README.md) | DPL gates, evidence, monitoring, and rollback |
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

After each run, use the [work-system routing rules](work-system/README.md), update the authoritative specialized record and ledger, and record only verified results. Update architecture, roadmap, or the chronological implementation log only when their owned facts change.

## Diagram rule

Keep Mermaid diagrams as directly editable source blocks. Do not add generated image replicas or duplicate diagram formats.
