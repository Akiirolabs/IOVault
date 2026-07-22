---
name: ticket
description: Produce a concise, evidence-based run handoff and one-sentence commit message. Use after implementation, debugging, refactoring, documentation, configuration, testing, or repository work in IO Vault; or when the user asks for a ticket, run summary, handoff, change summary, or commit sentence.
---

# Ticket

Summarize the actual completed run. Inspect the final diff, status, and verification output first; never infer success from edited code.

## Run detail

Lead with the outcome. For substantial work, cover only:

| Section | Content |
|---|---|
| Status | `✅ Verified`, `Implemented`, `Partial`, or `Blocked` based on evidence |
| Changed | Essential behavior, code, data, UI, API, or documentation changes |
| Value | Why the change matters |
| Verification | Exact tests, builds, checks, or manual validation that ran |
| Limits / next | Most relevant remaining constraint or follow-up; omit when none |

Use short prose or bullets instead of a table when easier to scan. Link relevant local files when useful.

## Commit sentence

End implementation and documentation handoffs with exactly:

`Commit sentence: \`<one concise sentence>\``

Write 8–18 words in imperative mood. Start with a strong verb such as `Add`, `Fix`, `Secure`, `Replace`, `Update`, `Refactor`, or `Document`. Capture the whole run without claiming verification inside the commit sentence.

Examples:

- `Commit sentence: \`Secure AI requests with authenticated limits and privacy-safe usage auditing.\``
- `Commit sentence: \`Replace browser-stored tokens with HttpOnly cookie sessions and CSRF protection.\``
- `Commit sentence: \`Synchronize verified issue status across concise architecture and implementation records.\``

## Integrity

- Use `✅ Verified` only after required verification passes on the final state.
- Distinguish earlier test results from checks run after the latest edit.
- Never invent commands, results, files, issue status, or user impact.
- Never expose secrets, tokens, personal data, prompts, or private content.
- If nothing changed, offer a proposed commit sentence only when requested; never imply a commit exists.
- If a commit was created, report its hash separately and use its real subject.
