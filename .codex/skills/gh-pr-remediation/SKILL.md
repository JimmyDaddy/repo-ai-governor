---
name: gh-pr-remediation
description: Repository-local GitHub PR remediation workflow. Use when the user asks to inspect the pull request associated with the current branch, summarize unresolved code review threads/comments, check GitHub gate or CI status, recheck reviewer feedback, implement fixes, push updates, and resolve addressed review threads. This skill expects `gh` CLI plus GitHub authentication (`gh auth login` or `GH_TOKEN`) and uses `scripts/github_pr_tool.py` for deterministic PR status collection and review-thread resolution.
---

# GitHub PR Remediation

## Overview

Use this skill to drive a current-branch GitHub PR from "needs work" back to "ready". Start with a deterministic PR snapshot, then fix valid review feedback and failing gates, push the branch, re-check GitHub status, and resolve only the review threads that are truly addressed.

If you are working inside this repository, read `AGENTS.md`, `.repo-ai-governor/context/current-context.md`, and the required L0 normative docs before changing code. GitHub review feedback is an input surface, not a replacement for repository-local truth.

If `gh auth status` fails or the current branch has no associated PR, stop and surface that as the blocker instead of guessing from local git metadata alone.

## Required Inputs

1. The current repository root, current branch, and `origin` remote.
2. GitHub authentication via `gh auth login` or `GH_TOKEN`.
3. The current workspace diff and any failing local verification evidence.
4. The repository's canonical local validation commands for the touched scope.
5. The review thread id from the PR snapshot when you are ready to resolve a thread.

## Workflow

1. Preflight
- Run `gh auth status`.
- Run `git branch --show-current`.
- Run `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status`.
- If auth is missing, tell the user exactly how to unblock it.
- If no PR exists for the current branch, report that and stop.

2. Read the PR snapshot
- Treat `reviewDecision`, unresolved review threads, and required failing or pending checks as the primary triage inputs.
- Use `--json` when you need machine-readable data for precise follow-up automation or structured summaries.
- Keep the unresolved thread ids; they are the canonical inputs for later resolution.

3. Recheck review feedback
- Read each unresolved thread in code context before changing anything.
- Separate valid issues from misunderstandings or already-fixed items.
- Keep a short repair list: file, risk, intended fix, verification command.
- Do not resolve a thread before the code change is pushed and rechecked.

4. Fix gate failures
- Start from required failing checks, then required pending checks, then non-required noise.
- Use the check names, workflow names, and links from the snapshot to find the failing job or log.
- Prefer reproducing the failure locally with the repository's canonical verification commands before patching.
- If the PR mixes code issues and gate/config issues, fix the smallest blocking set first.

5. Verify locally and push
- Run the smallest relevant local checks first, then the repository's required build/test gate before claiming the PR is green.
- Push the branch so GitHub re-runs checks.
- Re-run `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status` after the push to confirm the delta.

6. Resolve review threads
- Resolve only threads that are clearly addressed.
- Use `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py resolve-thread THREAD_ID`.
- If a reviewer explicitly requested follow-up confirmation or the discussion is still open, leave the thread unresolved and report the current status instead.

7. Final closeout
- Summarize the remaining unresolved threads, required failing checks, pending checks, and what was fixed.
- If anything is still blocked by auth, permissions, or GitHub-side execution, state that explicitly.

## Commands

```bash
python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status
python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status --json
python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status --repo JimmyDaddy/repo-ai-governor --branch feature/foo
python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py resolve-thread THREAD_ID
```

## Guardrails

1. Never claim GitHub PR status without a real `gh` query from the current change window.
2. Never resolve a review thread just because local code "looks fixed"; require pushed code plus a fresh recheck.
3. Never mark gate issues handled while required failing checks still exist or pending checks have not been acknowledged.
4. Prefer GitHub's current PR and checks data over stale local assumptions, but do not let GitHub comments override repository-local truth or code standards.
5. When auth is missing, treat that as a blocker and say so plainly.

## References

1. Read `references/github-pr-remediation-playbook.md` when you need deeper triage and remediation guidance.
2. Use `scripts/github_pr_tool.py` for deterministic PR snapshotting and review-thread resolution.
