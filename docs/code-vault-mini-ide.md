# Code Vault browser mini IDE

Code Vault supports local scratch files immediately. GitHub-backed projects require a GitHub App so repository access uses short-lived installation tokens instead of personal access tokens.

## GitHub App setup

1. Create a GitHub App owned by your account or organization.
2. Set its setup URL to `http://localhost:8787/api/code/github/callback` for local development. Use the deployed API URL in production.
3. Give it these repository permissions:
   - Metadata: read
   - Contents: read and write
   - Pull requests: read and write
   - Actions: read
4. Generate a private key and copy the values from `.env.example` into `.env.local`.
5. Restart `npm run dev`. Code Vault enables **Connect** when all three GitHub App values are present.

The server stores the installation ID, never the generated installation token. Tokens are requested from GitHub when needed and expire automatically.

## Storage boundaries

- `VaultState`: navigation, legacy code fields, notes, and snippet metadata.
- IndexedDB: bounded 25 MB LRU cache of opened repository files and immediate scratch edits.
- SQLite: durable scratch files, GitHub installation IDs, AI patch sets, and publication history.
- GitHub: repository source of truth, branches, commits, and draft pull requests.

Files over 1 MB, binary files, environment files, dependency folders, and common build outputs are not editable or sent to the assistant.

## AI workflow

The coding assistant receives only checked context files (maximum 12 files and 300,000 characters total), plus the task scratchpad when explicitly enabled. It returns a validated structured patch set. Users accept or reject each file before Code Vault creates a new `iovault/*` branch, one atomic commit, and a draft pull request.

