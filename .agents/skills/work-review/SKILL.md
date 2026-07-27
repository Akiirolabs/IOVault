---
name: work-review
description: Route IO Vault product work, manual feature reviews, security findings, system findings, corrections, and complete testing deployments into the Deployment Ledger lifecycle. Use when the user reports findings, performs an audit or review, starts a correction, plans a page outcome, or records a complete application state.
---

# Work Review Router

Route evidence and product outcomes through `DPL baseline → IMP work → FTR/SEC/SYS evidence and corrections → verification → next DPL`.

## Workflow

1. Read `docs/deployment-ledger/README.md`; it owns chronology, Versions, routing, and historical aliases.
2. Route complete states to DPL; page outcomes to the matching IMP-1001–1005; manual findings to FTR; security/privacy evidence to SEC plus one DBG; system/reliability evidence to SYS plus one DBG.
3. Preserve manual source codes as metadata. Create one dedicated `docs/feature-review-system/reviews/FTR-*.md` file per review and number findings beneath its FTR parent. Keep the Feature Review README as an index only.
4. Keep every page in its permanent hierarchy: Write 1001, Code Vault 1002, Projects 1003, Learning 1004, Career 1005.
5. Keep every DBG in exactly one SEC or SYS baseline; corrections update the originating FTR or DBG.
6. Only DPL and IMP may describe future outcomes. Record a DPL as deployed only with complete-state evidence; DPL does not automatically change Version.
7. Update the owning record and all concise linked indexes or release manifests, run `iovault-sync-docs`, validate, then use `ticket`.

Never invent evidence, create a correction-only code, duplicate an owned fact, reuse a retired identifier, or use a README as a substitute for a dedicated work record.
