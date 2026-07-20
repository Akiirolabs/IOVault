# IO Vault Debug System

This directory is the source-controlled record for verified defects, implementation decisions, attempts, and test evidence. Update the Markdown register and CSV together; append attempts rather than rewriting history; never record secrets, prompts, or vault contents.

## Workflow

1. Verify the report against current code and capture paths and behavior.
2. Set a status from the register vocabulary and choose the smallest safe fix.
3. Record the attempt, run the listed checks, and preserve exact summarized results.
4. Use `Verified` only when acceptance checks pass; use `Reopened` if later evidence contradicts the result.

Current focus: DBG-1001. Full cost quotas are deferred to DBG-1005 and context minimization to DBG-1002.
