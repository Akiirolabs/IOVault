# DBG-1012 — Dependency Pinning

- **Status / priority / last updated:** Confirmed; Medium; 2026-07-19.
- **Repository evidence:** `package.json` uses multiple `latest` and caret ranges, including React, Vite, and TypeScript.
- **What is wrong / affected services and files:** Manifest resolution can drift when the lockfile is regenerated; build/CI and all runtime services are indirectly affected.
- **Impact:** Supply-chain, compatibility, and reproducibility risk; updates can also deliver needed security fixes.
- **Best fix / why / example:** Pin deliberate versions in the manifest and use reviewed automated update PRs with lockfile/build gates.
- **Implementation plan / dependencies:** Record installed versions, select exact ranges, perform a clean install, test, and establish update cadence.
- **Fixes attempted:** Lockfile provides current-install determinism but does not resolve manifest policy.
- **Verification commands / results:** Needs clean install, test, build, and dependency audit.
- **Pros / cons:** Reproducibility; more deliberate maintenance and slower automatic patches.
- **Risks / rollback:** Pinning already-vulnerable versions; combine with scheduled updates.
- **Likely next fix / final outcome:** Define dependency update policy; unresolved.
