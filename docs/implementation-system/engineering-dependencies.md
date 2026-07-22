# Engineering Dependencies

This index prevents product plans from duplicating debugging and hardening work. The linked DBG record owns scope, status, attempts, and evidence; an IMP area only explains how the dependency affects its design.

| Concern | Authority | Product areas affected |
|---|---|---|
| Production secret enforcement | [DBG-1004](../debug-system/issues/DBG-1004-jwt-secret-fallback.md) | Any authenticated or AI workflow |
| System-wide abuse controls | [DBG-1005](../debug-system/issues/DBG-1005-rate-limiting.md) | Code Vault and AI-assisted pages |
| Workspace JSON growth | [DBG-1006](../debug-system/issues/DBG-1006-workspace-json-blob.md) | Notes, Projects, Learning, Career |
| Conflict-safe synchronization | [DBG-1007](../debug-system/issues/DBG-1007-sync-conflicts.md) | Every synced page |
| React monolith | [DBG-1008](../debug-system/issues/DBG-1008-app-component-monolith.md) | Shared UI and all page workspaces |
| Express monolith | [DBG-1009](../debug-system/issues/DBG-1009-server-monolith.md) | Server-backed feature delivery |
| Rich-text sanitization | [DBG-1010](../debug-system/issues/DBG-1010-rich-text-sanitization.md) | Notes, Projects, Learning |
| Input validation | [DBG-1011](../debug-system/issues/DBG-1011-input-validation.md) | New data models and APIs |
| Dependency pinning | [DBG-1012](../debug-system/issues/DBG-1012-dependency-pinning.md) | New editor, graph, or testing packages |
| Package separation | [DBG-1013](../debug-system/issues/DBG-1013-package-separation.md) | Shared frontend/server contracts |
| Monaco/React memory | [DBG-1014](../debug-system/issues/DBG-1014-monaco-and-react-state.md) | Code Vault |

Quality commands and missing gates belong in the [verification panel](verification-panel.md), not in a separate implementation workstream.
