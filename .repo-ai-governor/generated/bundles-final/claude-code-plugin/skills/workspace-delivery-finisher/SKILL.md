---
name: workspace-delivery-finisher
description: Finish the current workspace safely by running the repository delivery gate, generating a Conventional Commit message, creating a git commit, and optionally pushing to the active remote branch. Use when the user asks to "收尾", "提交并推送", "收尾并推送", "commit", or otherwise wants end-of-task delivery in this repository.
---

# Workspace Delivery Finisher

## Overview

Run the repository-local delivery workflow in strict order. Use this skill to turn natural-language delivery requests into a repeatable sequence: inspect git state, run the gate, create a Conventional Commit, commit, and push only when the user explicitly asks for it.

## Trigger Mapping

1. Treat `收尾` as: run gate -> create Conventional Commit -> commit only.
2. Treat `提交并推送` and `收尾并推送` as: run gate -> create Conventional Commit -> commit -> push.
3. Do not push for `收尾` unless the user later asks for it explicitly.
4. Prefer this repository-local skill over any generic delivery skill when both could apply.

## Workflow

1. Inspect repository state.
- Run `git status -sb`, `git branch --show-current`, and `git remote -v`.
- If there are no local changes, stop and report that there is nothing to deliver.

2. Run the repository gate.
- Use `pnpm run check` as the default gate for this repository.
- If `pnpm` is not on the shell `PATH`, call `/opt/homebrew/bin/pnpm run check` with the same `PATH` prefix.
- If the gate fails, stop immediately. Do not stage, commit, or push.

3. Stage the delivery.
- By default, stage all current workspace changes with `git add .`.
- If the user explicitly asks for a partial commit, only stage the requested paths.
- Never unstage or discard unrelated user changes unless the user explicitly asks.

4. Create the Conventional Commit message.
- Use `<type>(<scope>): <subject>` when a scope is clear; otherwise use `<type>: <subject>`.
- Infer the type from the actual change:
  - `feat` for new capability or workflow
  - `fix` for bug fixes
  - `docs` for documentation-only updates
  - `chore` for maintenance or configuration
- Keep the subject short, action-oriented, and specific to the delivered change.

5. Create the commit.
- Use a normal non-interactive `git commit -m "<message>"`.
- Do not amend unless the user explicitly asks.
- Do not use `--no-verify` unless the user explicitly asks.

6. Push only when the trigger requires it.
- For `收尾`, stop after a successful local commit.
- For `提交并推送` and `收尾并推送`, push to `origin <current-branch>` unless the user specifies another remote or branch.
- If no remote is configured, stop after the commit and report that push could not be completed.

7. Return the delivery result.
- Always report the gate command result, branch name, commit hash, and commit message.
- When a push was requested, also report the push destination or the exact blocker.

## Guardrails

1. Never use destructive git commands such as `git reset --hard` or `git checkout --`.
2. Never push on a plain `收尾`.
3. Never fabricate a green gate result; if the check command fails, surface the failure.
4. Never skip the gate just because the changes look small.
5. Respect existing repository rules in `AGENTS.md` and current sprint task records when summarizing the result.

## Result Template

Use this structure in the final response, adapted to the actual outcome:

1. `Gate`: command + pass/fail
2. `Commit`: commit hash + Conventional Commit message
3. `Push`: destination or reason it was skipped
4. `Blockers`: only when something prevented completion

## Portable Prompt

When another AI tool cannot load skill folders, paste this prompt directly:

```text
你是当前仓库的交付收尾助手。严格执行：1）pnpm run check；2）失败就停止并汇报；3）通过后为当前变更生成 Conventional Commit message 并提交；4）只有用户明确说“提交并推送”或“收尾并推送”时才执行 git push origin <当前分支>；5）返回门禁结果、commit hash、commit message 和 push 结果。禁止危险 git 命令，禁止未授权时 amend 或 --no-verify。
```
