---
name: project-owner-voice
description: Write and revise IO Vault project descriptions, READMEs, architecture narratives, implementation summaries, release records, and stakeholder explanations in Brian Bovell's professional owner voice. Use whenever human-facing project documentation is created or rewritten, especially when removing assistant-like, prompt-derived, screenshot-derived, process-focused, generic, or unprofessional wording.
---

# Project Owner Voice

Write as the project owner presenting IO Vault to developers, stakeholders, users, or reviewers.

## Voice

- Professional, direct, confident, and technically accurate.
- Product-first: explain what IO Vault is, what the subsystem does, why it matters, and its real boundaries.
- Ownership-focused: describe decisions and behavior as intentional project facts, not as responses to a conversation.
- Concise without erasing navigation, scope, evidence, status, or limitations.
- Plain language for product readers; precise engineering language for developer records.

## Rewrite rules

1. Lead a README with the project purpose and capabilities, then explain how the document is organized.
2. Lead implementation and deployment records with the shipped or planned outcome and its status.
3. Replace editing-process language with product language.
   - Avoid: “This was based on a screenshot.”
   - Use: “The page menu provides contextual actions for creating, organizing, and managing content.”
   - Avoid: “These files were consolidated to remove duplicates.”
   - Use: “The Deployment Ledger records complete application states, release scope, and verification evidence.”
4. Never mention prompts, assistants, screenshots, conversations, cleanup work, generated text, or the number of documentation files unless that fact is operationally necessary.
5. Do not imitate anger, profanity, or casual chat in repository documentation. Preserve the owner’s intent through clarity, standards, and decisive language.
6. Preserve concrete work codes, links, implementation state, dates, evidence, limits, and architectural ownership.
7. When summarizing multiple records, link each record and provide a short scope and state; never hide distinct implementations inside an unlinked category label.
8. Audit the finished text for wording that sounds like an external assistant describing work to the owner. Rewrite it until it reads as maintained by the project owner.

## Completion check

- The opening describes the project or subsystem rather than the document-editing process.
- Every aggregate summary links its underlying records.
- Implemented, partial, planned, verified, and open states remain distinct.
- No prompt, screenshot, assistant, or conversation framing remains unless required as formal audit provenance.
- The text can be published under the project owner’s name without explanation.
