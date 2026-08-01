# FTR-1011 - Agent Conversation and Voice Review

| Field | Detail |
|---|---|
| Application surface | Shared Mentor and Career Agent Workspace |
| Implementations | [IMP-1004 - Mentor Agent](../../implementation-system/implementations/IMP-1004-learning-mentor.md) and [IMP-1005 - Career Agent](../../implementation-system/implementations/IMP-1005-career.md) |
| Affected IMP work | `IMP-1004.2.1`, `IMP-1004.2.5.3`, `IMP-1005.2.1`, and `IMP-1005.2.5.3` |
| Manual source title | Agent Career/Learning: FTR-1011 |
| Source file | `FTR-1011.pdf` |
| Source date | 2026-08-01 |
| Recorded | 2026-08-01 |
| Status | **Verified - 5 of 5 findings verified** |

## Findings

| Finding | Observed requirement | Affected IMP work | Status |
|---|---|---|---|
| &emsp;`FTR-1011.1` | Maintain a continuous agent conversation without lapses and keep the conversation visibly transcribed | `IMP-1004.2.1.1`, `IMP-1005.2.1.1` | Verified |
| &emsp;`FTR-1011.2` | Use a softer, more human conversational tone that feels like speaking with a trusted friend without weakening accuracy or policy boundaries | `IMP-1004.2.1.2`, `IMP-1005.2.1.2` | Verified |
| &emsp;`FTR-1011.3` | Move the active transcribed conversation to the left side of the Agent Workspace | `IMP-1004.2.1.3`, `IMP-1005.2.1.3` | Verified |
| &emsp;`FTR-1011.4` | Show **Saved to cloud** instead of **Saved**, save changes continuously, and reserve stronger validation feedback for substantial change sets | `IMP-1004.2.5.3.1`, `IMP-1005.2.5.3.1` | Verified |
| &emsp;`FTR-1011.5` | **Urgent:** stop spoken-response looping and provide clear controls for starting, stopping, muting, and cancelling agent voice | `IMP-1004.2.1.4`, `IMP-1005.2.1.4` | Verified |

## Acceptance

- Conversation text remains continuous and recoverable after navigation or reload.
- Tone changes remain role-appropriate, truthful, concise, and subject to existing approval and safety policy.
- The transcript layout works on desktop, mobile, keyboard, and screen-reader paths.
- Cloud-save status reflects confirmed durable state rather than optimistic browser state.
- Spoken output never restarts or overlaps after stop, mute, navigation, cancellation, or a new response.

## Implemented correction

| Finding | Completed result |
|---|---|
| `FTR-1011.1` | The active conversation renders every durable message and automatically follows new messages without truncating history. |
| `FTR-1011.2` | Mentor and Career instructions now require a warm, trusted tone while preserving truthfulness, accuracy, approval, and safety boundaries. |
| `FTR-1011.3` | Desktop workspaces place the conversation in a dedicated left column; narrower layouts stack it beneath the primary agent controls. |
| `FTR-1011.4` | Agent pages identify confirmed persistence as **Saved to cloud**. |
| `FTR-1011.5` | The event cursor survives mute changes, duplicate events are ignored, speech requests are cancellation-safe, and recording, mute, stop-response, task-cancel, and navigation cleanup stop active audio. |

## Verification

| Gate | Evidence |
|---|---|
| Focused tests | Six Agent Workspace and durable-runtime tests passed, including complete transcript rendering, tone policy, and duplicate voice-event suppression. |
| Full regression | `npm test`: 14 files and 66 tests passed on 2026-08-01. |
| Production build | `npm run build` passed on 2026-08-01. |
| Browser acceptance | Signed-in Mentor rendering confirmed the active conversation, cloud-save label, responsive fallback, and explicit voice controls. |
