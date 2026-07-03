# IO Vault

IO Vault is a personal workspace for code notes, writing, learning plans, career materials, project tracking, and an AI assistant.

The frontend is a Vite + React app. Workspace data is saved in `localStorage`. The optional backend is an Express API that proxies AI requests to OpenAI through `POST /api/agent`.

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

Create `.env.local` with `OPENAI_API_KEY=...` before using live AI features.

## Documentation

- [Docs index](docs/README.md)
- [Architecture and implementation map](docs/architecture.md)
- [Diagrams](docs/diagrams.md)
- [Implementation log](docs/implementation-log.md)
- [Roadmap](docs/roadmap.md)

## Verification

```bash
npm run build
```
