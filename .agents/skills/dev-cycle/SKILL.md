---
name: dev-cycle
description: Coordinate bounded autonomous improvement cycles between DevMind, an independent read-only auditor, and DevBase, a scoped implementation engineer. Use when asked to repeatedly audit, fix, test, and re-audit IO Vault until objective quality gates pass or a defined blocker or iteration limit is reached. Never commit, push, deploy, install dependencies, or handle secrets without explicit user approval.
---

# Dev Cycle

Run an evidence-driven audit and repair loop. Aim for all defined gates to pass; never claim software is perfect.

Read [quality-gates.md](references/quality-gates.md) completely before starting a cycle.

## Roles

- **DevMind (`$devmind`):** independently audit code, diffs, tests, logs, performance risks, and gate results without editing files.
- **DevBase (`$devbase`):** confirm selected findings, make minimal scoped fixes, add regression coverage, and run checks without approving its own work.
- **Orchestrator:** maintain cycle state, enforce authority limits, pass raw evidence between roles, and decide whether to continue or stop.

When the user explicitly authorizes delegation and agent delegation is available, use separate fresh agents with `$devmind` and `$devbase`. Give each only its role, repository scope, acceptance criteria, and required raw artifacts. Do not leak the expected conclusion to DevMind. Otherwise, invoke the skills in clearly separated sequential passes and re-read the resulting diff before the audit pass.

## Cycle protocol

Default to at most six cycles unless the user specifies a lower limit.

1. **Baseline:** read repository instructions, inspect working-tree state, run available gates before editing, and separate pre-existing failures.
2. **Audit:** have DevMind report prioritized findings with severity, exact evidence, reproduction, user impact, and measurable acceptance criteria.
3. **Select:** address critical and high findings first. Group only tightly related fixes and defer cosmetic work while functional failures remain.
4. **Implement:** have DevBase confirm and fix selected findings, add regression coverage, and return a concise handoff.
5. **Verify:** run focused tests and every available gate in `quality-gates.md`. Record exact commands and results.
6. **Re-audit:** give DevMind the current diff and raw verification output. Classify each finding as resolved, unresolved, regressed, or unverified and identify newly introduced issues.
7. **Decide:** finish only when completion criteria pass; otherwise start the next bounded cycle with unresolved actionable findings.

## Completion criteria

Finish with `PASSED WITHIN DEFINED GATES` only when:

- every available automated gate passes;
- no confirmed critical or high finding remains;
- selected functional scenarios pass;
- regression tests cover fixed defects where practical;
- DevMind approves the final diff;
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
