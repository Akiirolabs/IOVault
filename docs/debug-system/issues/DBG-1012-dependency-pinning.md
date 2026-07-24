# DBG-1012 — Dependency Pinning

| Field | Detail |
|---|---|
| Status | **Planned** · Medium · 2026-07-19 |
| Evidence | `package.json` uses `latest` and caret ranges for core runtime/build packages |
| Impact | Manifest drift, compatibility failures, and supply-chain uncertainty |
| Fix | Pin reviewed versions; automate update PRs with lockfile, test, build, and audit gates |
| Verify | Clean install, test, build, and dependency audit |
| Tradeoffs | Reproducible installs; security updates require deliberate maintenance |
| Next | Define update cadence and pin current verified versions |
