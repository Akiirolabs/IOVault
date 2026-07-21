# IO Vault

IO Vault is a personal workspace for code notes, writing, learning plans, career materials, project tracking, and an AI assistant.

The frontend is a Vite + React app backed by a required Express API and per-user SQLite storage. Browser caches keep editing responsive, while HttpOnly cookie sessions protect authenticated workspace, AI, Code Vault, and GitHub operations.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal, usually `http://localhost:5173/`.

For frontend-only work:

```bash
npm run dev:web
```

For the API only:

```bash
npm run dev:api
```

Create `.env.local` with `OPENAI_API_KEY=...` before using live AI features. GitHub-backed Code Vault work additionally requires the GitHub App values documented in `.env.example`.

## Documentation

- [Docs index](docs/README.md)
- [Architecture and implementation map](docs/architecture.md)
- [Diagrams](docs/diagrams.md)
- [Implementation log](docs/implementation-log.md)
- [Roadmap](docs/roadmap.md)
- [Code Vault mini IDE](docs/code-vault-mini-ide.md)
- [Debug system](docs/debug-system/README.md)

## Verification

```bash
npm test
npm run build
```
