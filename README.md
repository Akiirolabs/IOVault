# Progress Command Center

A very basic personal dashboard for tracking:

- Lab progress
- Career applications
- Education progress and learning resources
- Latest GitHub Actions test status for a public repository

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## GitHub Test Status

Use the `owner/repository` format in the GitHub card, then click **Check tests**. The app uses GitHub's public API, so it works best with public repositories. Private repositories need a backend or token-based integration before they can be checked securely.
