# FTR-1010 - Global AI Chat Review

| Field | Detail |
|---|---|
| Application surface | Global AI assistant |
| Included testing state | [DPL-1002 - Current Testing State](../../deployment-ledger/DPL-1002-current-testing-state.md) |
| Related safeguards | [SEC-1.0](../../audit-system/SEC-1.0-security-baseline.md) and [SYS-1.0](../../audit-system/SYS-1.0-system-baseline.md) |
| Manual source title | AI Chat: FTR-1010 |
| Source file | `FTR-1010.pdf` |
| Source date | 2026-07-30 |
| Recorded | 2026-07-30 |
| Status | **Verified - 5 of 5 findings verified** |

## Findings

| Finding | Observed requirement | Owning work | Status |
|---|---|---|---|
| &emsp;`FTR-1010.1` | Remove the visible GPT model label from the bottom of the assistant | `DPL-1002` shared assistant | Verified |
| &emsp;`FTR-1010.2` | Keep the input at the bottom and provide a scrollable conversation history instead of replacing the previous response | `DPL-1002` shared assistant | Verified |
| &emsp;`FTR-1010.3` | Provide past chat history through a three-dot menu at the top of the assistant | `DPL-1002` shared assistant | Verified |
| &emsp;`FTR-1010.4` | Replace the **Ask AI** text button with an upward-arrow send control beside the input | `DPL-1002` shared assistant | Verified |
| &emsp;`FTR-1010.5` | Add a Context control that lists submitted context in a compact panel and supports selecting or removing individual items | `DPL-1002` shared assistant | Verified |

## Implemented correction

| Area | Verified result |
|---|---|
| Conversation | Messages remain in a scrollable thread, and bounded recent history is included in follow-up requests. |
| History | The top three-dot menu creates, lists, and restores user-scoped conversations persisted through the existing workspace sync. |
| Composer | The compact composer stays at the bottom, supports Enter to send and Shift+Enter for a new line, and uses an upward-arrow send control. |
| Context | The Context panel identifies each selected page, allows individual removal, and submits no workspace data unless a page is explicitly added. |
| Presentation | Provider-model labels are not exposed in the assistant interface. |

## Verification

- `npm test`: 12 test files and 57 tests passed on 2026-07-30.
- `npm run build`: TypeScript and Vite production build passed on 2026-07-30.
- Browser acceptance confirmed context add/remove, multi-message rendering, chat creation and restoration, history persistence after reload, compact sending, and removal of the visible model label.
