# DBG-1002 — Entire Vault Sent to OpenAI

| Field | Detail |
|---|---|
| Status | **✅ Verified** · Critical · 2026-07-20 |
| Evidence | Old client sent `vaultState`; server serialized it into every OpenAI request |
| Impact | Privacy exposure, cost, latency, context overflow, prompt injection |
| Fix | No context by default; visible active-page opt-in; bounded summaries; 64 KB server limit; ignore legacy `vaultData` |
| Verify | Tests prove selected data is sent, other pages and legacy vault secrets are excluded; 17 tests + build passed |
| Tradeoffs | Stronger privacy and lower cost; selected context can omit relevant information |
| Next | Monitor answer quality; add retrieval only if evidence justifies it |
