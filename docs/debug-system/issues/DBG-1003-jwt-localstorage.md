# DBG-1003 — JWT Stored in localStorage

| Field | Detail |
|---|---|
| Status | **✅ Verified** · Critical · 2026-07-21 |
| Evidence | Old SPA and Code Vault helpers read `io-vault-token`; auth responses returned the JWT |
| Impact | XSS could steal a session and access private vault data |
| Fix | JWT-backed HttpOnly SameSite cookie; `Secure` in production; CSRF header on cookie mutations; logout clearing; legacy token removal |
| Verify | Token absent from auth JSON/headers used by JS; cookie flags, `/me`, CSRF rejection, logout, Code Vault requests; 20 tests + build passed |
| Tradeoffs | Bearer remains for API compatibility; offline logout cannot clear the server cookie until connectivity returns |
| Next | DBG-1004: require the production JWT secret |
