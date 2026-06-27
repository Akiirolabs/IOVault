# Progress Command Center

A very basic personal dashboard for tracking:

- Lab progress
- Career applications
- Education progress and learning resources
- Latest GitHub Actions test status for a public repository

## Run Locally

```bash
npm install
cp .env.example .env.local   # add your OPENAI_API_KEY
npm run dev
```

Open the local URL Vite prints in the terminal.

## GitHub Test Status

Use the `owner/repository` format in the GitHub card, then click **Check tests**. The app uses GitHub's public API, so it works best with public repositories. Private repositories need a backend or token-based integration before they can be checked securely.

## Deploy on a VPS

The production setup serves the built frontend and the `/api/agent` backend from a single Node process on port **8787**. Put **nginx** (or Caddy) in front for HTTPS.

### Option A: Docker (recommended)

On the VPS:

```bash
git clone <your-repo-url> io-vault
cd io-vault
cp .env.example .env.local
# Edit .env.local — set OPENAI_API_KEY

docker compose up -d --build
```

The app listens on `0.0.0.0:8787`. Point nginx at `127.0.0.1:8787` — see `deploy/nginx.conf`. Use [Certbot](https://certbot.eff.org/) for TLS.

### Option B: Node + systemd

```bash
git clone <your-repo-url> /var/www/io-vault
cd /var/www/io-vault
cp .env.example .env.local
# Edit .env.local — set OPENAI_API_KEY

npm ci
npm run build
sudo cp deploy/io-vault.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now io-vault
```

Configure nginx the same way (`deploy/nginx.conf`).

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | For AI features | — | OpenAI API key |
| `API_HOST` | No | `0.0.0.0` | Bind address (`127.0.0.1` behind nginx) |
| `API_PORT` | No | `8787` | HTTP port |

### Notes

- Vault data stays in the **browser** (`localStorage`) — it is not stored on the server.
- Restrict access at the firewall or with nginx basic auth if this is a private dashboard.
- For updates: `git pull`, then `docker compose up -d --build` or `npm run build && sudo systemctl restart io-vault`.
