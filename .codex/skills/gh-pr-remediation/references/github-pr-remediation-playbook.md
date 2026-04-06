# GitHub PR Remediation Playbook

## Overview

Use this reference when the core skill flow is not enough and you need more detail on how to interpret PR state, triage review feedback, and turn failing GitHub checks back to green.

## Preflight

1. Confirm the repository root and branch:
   - `git rev-parse --show-toplevel`
   - `git branch --show-current`
2. Confirm GitHub auth:
   - `gh auth status`
3. Collect the initial snapshot:
   - `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status`
   - `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status --json`

## How To Read The Snapshot

### PR Summary

- `reviewDecision`
  - `CHANGES_REQUESTED`: reviewer feedback is still blocking merge.
  - `APPROVED`: review state is not the blocker; focus on unresolved threads and failing gates.
  - `REVIEW_REQUIRED` or empty: review state is not yet settled.
- `mergeStateStatus`
  - Use this as a hint for mergeability, not as a replacement for reading check and review state.

### Unresolved Review Threads

- Treat each unresolved thread as an explicit recheck item.
- Prioritize threads that are:
  - on changed files
  - on correctness, security, rollback, or test coverage
  - still active instead of `isOutdated=true`
- If a thread appears outdated because the diff moved, still read the current code before deciding whether it is addressed.

### Checks And Gates

- Required failing checks are the first repair target.
- Required pending checks may indicate:
  - GitHub has not started a run yet
  - a run is in progress
  - branch protections are waiting on a required workflow
- Non-required failures are still worth reading if they point to real regressions, but do not let them hide the actual merge blockers.

## Review Feedback Recheck

1. Read the unresolved thread in code context.
2. Decide whether the feedback is:
   - valid and actionable
   - already fixed
   - obsolete after later changes
   - blocked by a broader design decision that should be reported instead of silently changed
3. For valid items, record:
   - target file
   - risk
   - intended fix
   - verification command
4. Keep user-facing summaries concrete. Do not say "fixed comments" without listing which thread or issue was addressed.

## Gate Failure Triage

1. Start from the required failing checks in the snapshot.
2. Read the workflow and check names.
3. Use the provided link when the failing job needs GitHub-hosted logs.
4. When you need CLI log inspection, use one of:
   - `gh pr checks --required`
   - `gh pr checks --watch`
   - `gh run view`
   - `gh run view --log-failed`
5. Reproduce locally with the repository's canonical verification commands before patching when feasible.

## Fix And Verify Loop

1. Apply the smallest safe patch that addresses the confirmed issue.
2. Run focused local verification first.
3. Run the repository's required build and test gates before claiming the PR is clean.
4. Push the branch.
5. Re-run the PR snapshot.
6. Compare:
   - unresolved thread count
   - required failing checks
   - required pending checks
   - review decision

## Resolving Review Threads

Use the script only after the fix is pushed and a fresh snapshot confirms the thread is actually addressed.

```bash
python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py resolve-thread THREAD_ID
```

Do not resolve a thread when:

- the reviewer asked for follow-up confirmation
- the issue is only partially fixed
- the discussion shifted to a broader follow-up task
- the thread is still the only evidence of an unresolved design concern

## Common Blockers

### Missing GitHub Auth

- Symptom: `gh auth status` fails.
- Action: stop and ask for `gh auth login` or `GH_TOKEN`.

### Current Branch Has No PR

- Symptom: the status script says no PR is associated with the branch.
- Action: stop and report that no GitHub PR can be inspected yet.

### Checks Are Pending For A Long Time

- Symptom: required checks remain pending after push.
- Action: report the pending state, read the workflow link, and distinguish between "waiting for GitHub" and "still failing locally".

### Review Thread Looks Outdated

- Symptom: `isOutdated=true` but the comment still looks relevant.
- Action: read the current code anyway; outdated does not automatically mean resolved.
