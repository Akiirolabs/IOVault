# FTR-1010 - Global AI Chat Review

| Field | Detail |
|---|---|
| Application surface | Global AI assistant |
| Owning planned state | [DPL-1003 - Next Complete Testing State](../../deployment-ledger/DPL-1003-next-testing-state.md) |
| Related safeguards | [SEC-1.0](../../audit-system/SEC-1.0-security-baseline.md) and [SYS-1.0](../../audit-system/SYS-1.0-system-baseline.md) |
| Manual source title | AI Chat: FTR-1010 |
| Source file | `FTR-1010.pdf` |
| Source date | 2026-07-30 |
| Recorded | 2026-07-30 |
| Status | **Open - 0 of 5 findings verified** |

## Findings

| Finding | Observed requirement | Owning work | Status |
|---|---|---|---|
| &emsp;`FTR-1010.1` | Remove the visible GPT model label from the bottom of the assistant | `DPL-1003` shared assistant outcome | Open |
| &emsp;`FTR-1010.2` | Keep the input at the bottom and provide a scrollable conversation history instead of replacing the previous response | `DPL-1003` shared assistant outcome | Open |
| &emsp;`FTR-1010.3` | Provide past chat history through a three-dot menu at the top of the assistant | `DPL-1003` shared assistant outcome | Open |
| &emsp;`FTR-1010.4` | Replace the **Ask AI** text button with an upward-arrow send control beside the input | `DPL-1003` shared assistant outcome | Open |
| &emsp;`FTR-1010.5` | Add a Context control that lists submitted context in a compact panel and supports selecting or removing individual items | `DPL-1003` shared assistant outcome | Open |

## Correction status

No correction is claimed. The assistant interaction model, persistent conversation boundary, and context controls require an implementation owner and verification before these findings can close.

