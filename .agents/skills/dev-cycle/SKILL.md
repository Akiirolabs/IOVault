---
name: dev-cycle
description: Coordinate bounded autonomous improvement cycles among DevAudit's product-experience planning, DevMind's independent technical audit, and DevBase's scoped implementation. Use when asked to repeatedly review, audit, fix, test, and re-review IO Vault until objective quality gates and affected user workflows pass or a defined blocker or iteration limit is reached. Never commit, push, deploy, install dependencies, or handle secrets without explicit user approval.
---

# Dev Cycle

Run an evidence-driven audit and repair loop. Aim for all defined gates to pass; never claim software is perfect.

Read [quality-gates.md](references/quality-gates.md) completely before starting a cycle.

## Roles

- **DevAudit (`$dev-audit`):** inventory real user workflows, route evidence into implementation-ready FTR/SEC/SYS plans, and re-test affected experience outcomes without implementing fixes or approving technical quality.
- **DevMind (`$devmind`):** independently audit code, diffs, tests, logs, performance risks, and gate results without editing files.
- **DevBase (`$devbase`):** confirm selected findings, make minimal scoped fixes, add regression coverage, and run checks without approving its own work.
- **Orchestrator:** maintain cycle state, enforce authority limits, pass raw evidence between roles, and decide whether to continue or stop.

When the user explicitly authorizes delegation and agent delegation is available, use separate fresh agents for the applicable roles. Give each only its role, repository scope, acceptance criteria, and required raw artifacts. Do not leak DevAudit's preferred outcome or DevBase's expected conclusion to DevMind. Otherwise, invoke the skills in clearly separated sequential passes and re-read the resulting diff before the audit pass.

## Cycle protocol

Default to at most six cycles unless the user specifies a lower limit.

1. **Baseline:** read repository instructions, inspect working-tree state, run available gates before editing, and separate pre-existing failures.
2. **Experience plan:** when the cycle begins from a feature review or product audit, have DevAudit inventory the affected workflows and return routed findings, raw evidence, preservation constraints, and measurable acceptance criteria.
3. **Independent audit:** have DevMind independently confirm technical claims and report any additional prioritized findings without inheriting the expected conclusion.
4. **Select:** address critical and high findings first. Group only tightly related fixes and defer cosmetic work while functional failures remain.
5. **Implement:** have DevBase confirm and fix selected findings, add regression coverage, and return a concise handoff.
6. **Verify:** run focused tests and every available gate in `quality-gates.md`. Record exact commands and results.
7. **Technical re-audit:** give DevMind the current diff and raw verification output. Classify each finding as resolved, unresolved, regressed, or unverified and identify newly introduced issues.
8. **Experience re-review:** when DevAudit initiated or materially scoped the cycle, repeat the affected real-user workflows after DevMind's review and classify each experience finding as resolved, unresolved, regressed, or unverified.
9. **Decide:** finish only when completion criteria pass; otherwise start the next bounded cycle with unresolved actionable findings.

## Completion criteria

Finish with `PASSED WITHIN DEFINED GATES` only when:

- every available automated gate passes;
- no confirmed critical or high finding remains;
- selected functional scenarios pass;
- regression tests cover fixed defects where practical;
- DevMind approves the final diff;
- affected DevAudit workflows pass when the cycle originated from a product or feature review;
- no unreviewed DevBase change follows that approval.

Report unavailable gates explicitly. Never translate unavailable verification into a pass.

## Hard stops

Stop and request user direction when:

- six cycles are exhausted;
- the same failure survives two attempted fixes;
- tests cannot run because dependencies or infrastructure are unavailable;
- a fix requires dependency installation or upgrades, secrets, external services, billing, production access, destructive data changes, or a major architecture or product decision;
- requirements are ambiguous or contradictory;
- overlapping user changes cannot be preserved safely;
- the next change cannot be validated objectively;
- two consecutive cycles show no measurable improvement.

## Final report

Return:

1. status: `PASSED WITHIN DEFINED GATES`, `STOPPED - BLOCKED`, or `STOPPED - CYCLE LIMIT`;
2. cycles completed;
3. fixes and regression tests added;
4. exact gate results;
5. unresolved findings and risks;
6. files changed;
7. confirmation that nothing was committed, pushed, deployed, or installed without explicit approval.
