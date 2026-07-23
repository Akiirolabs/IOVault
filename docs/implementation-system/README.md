# IO Vault Implementation System

This folder turns product ideas into traceable design and delivery work. It owns user experience, feature behavior, design decisions, phased scope, and acceptance—not defects or platform hardening.

| System | Authoritative responsibility |
|---|---|
| Implementation system | Product and UX design, feature phases, and user-facing acceptance |
| [Debug system](../debug-system/README.md) | Bugs, security, hardening, technical debt, remediation, and verification evidence |
| [Architecture](../architecture.md) | Current runtime boundaries and approved target direction |
| [Roadmap](../roadmap.md) | Priority across product delivery and engineering risk |

| Start here | Purpose |
|---|---|
| [Implementation register](implementation-register.md) | Priority, state, dependencies, and next deliverable |
| [Verification panel](verification-panel.md) | Available and missing quality gates |
| [Engineering dependencies](engineering-dependencies.md) | Compact links to authoritative DBG records and shared constraints |
| [Area plans](areas/) | Current state, phases, acceptance, and limits per product area |
| [Implementation map](graphs/implementation-map.md) | Product dependencies and DBG blockers |
| [Templates](templates.md) | Area, verification, and run records |
| [Implementation log](../implementation-log.md) | One append-only delivery history |

## Status rule

`✅ Verified` requires current evidence from the area’s acceptance checks. `Implemented` means the capability exists but is not fully accepted; `Partial` means only part of the target exists; `Planned` means no target implementation is claimed.

## Working rule

Every feature run updates its area plan, the register, verification evidence, and the global implementation log. Defects discovered during design receive a DBG record and only a link here. Architecture and roadmap files change only when their boundaries or priorities change.
