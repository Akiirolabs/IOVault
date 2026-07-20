# DBG-1013 — Package Separation

- **Status / priority / last updated:** Confirmed architecture limitation; Low; 2026-07-19.
- **Repository evidence:** One root `package.json` owns browser, Express, database, test, and build dependencies.
- **What is wrong / affected services and files:** Frontend and API dependency/deployment boundaries cannot be managed independently.
- **Impact:** Larger install surface and coupled upgrades; no immediate proven security defect by itself.
- **Best fix / why / example:** Split workspaces only when independent deployment or ownership warrants the added complexity.
- **Implementation plan / dependencies:** Document boundaries, separate shared types, then introduce frontend/server packages with coordinated scripts.
- **Fixes attempted:** None; existing single package remains functional.
- **Verification commands / results:** Needs clean workspace install plus frontend/API test and build matrix.
- **Pros / cons:** Clear runtime ownership; more configuration and cross-package versioning.
- **Risks / rollback:** Tooling churn without product benefit; retain root scripts during migration.
- **Likely next fix / final outcome:** Address server/frontend modularity first; no package split selected yet.
