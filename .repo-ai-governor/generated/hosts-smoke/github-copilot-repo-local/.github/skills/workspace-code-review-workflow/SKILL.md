---
name: workspace-code-review-workflow
description: Repository-local code review workflow for this workspace. Use when the user says "帮我 cr 代码", "帮我cr代码" ,"code review", "复核 code review 报告", "复核 cr 报告", "复核 code review 报告并修复", "复核 cr 报告并修复", "执行 cr 修复", or otherwise wants to review the current working tree, recheck the current sprint's pending CR report, or fix accepted findings from a verified sprint CR report. The skill always reads `.repo-ai-governor/context/current-context.md` and writes review artifacts to the resolved review target directory (`explicit path -> Worktree Review Target -> active primary stream`) instead of `docs/review`.
---

# Workspace Code Review Workflow

## Overview

Read `.repo-ai-governor/context/current-context.md` before doing anything else. Resolve the review output path in this order: user-specified report path -> `Worktree Review Target` `review/` path -> active primary stream `review/` path. Treat the resolved directory as the only output location for review artifacts; if the user says `code-view`, interpret it as the same resolved `review/` directory.

Prefer this repository-local skill over the generic `code-review-workflow` skill whenever the request targets the current workspace or the current sprint CR lifecycle.

## Trigger Mapping

1. `帮我cr代码` / `帮我 cr 代码` / `code review`
- Review only the files currently modified in the working tree.
- Create `code_review_<slug>.md` in the resolved `review/` directory only when the review contains actionable findings.
- If the review finds no actionable repair item, write `resolved_code_review_<slug>.md` directly.

2. `复核 code review 报告` / `复核 cr 报告`
- Find the resolved review target directory report that is still pending verification (`code_review_*.md`).
- Append a `## 复核结论（YYYY-MM-DD）` section.
- Rename the file to `verified_code_review_<slug>.md`.

3. `复核 code review 报告并修复` / `复核 cr 报告并修复`
- Perform the recheck workflow first.
- Fix only findings marked `认可` or the accepted subset of `部分认可`.
- Append `## 修复执行记录（YYYY-MM-DD）`.
- Rename the file to `resolved_code_review_<slug>.md` only when every actionable item is completed and no blocker or skipped item remains.

4. `执行 cr 修复`
- Work only from resolved review target directory `verified_code_review_*.md` files that are not already `resolved_`.
- Prefer the report path specified by the user; otherwise choose the most recently updated unresolved verified report.
- Fix only accepted and actionable findings, then append repair results in place.

## Required Inputs

1. Read `AGENTS.md`.
2. Read `.repo-ai-governor/context/current-context.md`.
3. Read the repository normative docs required by `AGENTS.md` before judging correctness.
4. Use `git status --short` and `git diff` to determine the current review scope.
5. Use the resolved review target path from current-context; never write CR output to `docs/review`.

## Workflow A: Create Review Report

1. Resolve the review scope.
- Use `git status --short`, `git diff --name-only --diff-filter=ACMR`, and `git diff --cached --name-only --diff-filter=ACMR`.
- Include modified tracked files, staged files, and newly added files that are part of the current working tree change.

2. Resolve the review output directory.
- Prefer the report path explicitly provided by the user.
- Otherwise, if `current-context.md` declares one `Worktree Review Target`, use its `Review records` path.
- Otherwise, use the active primary stream `review/` path.
- Treat `Worktree Review Target` as single-valued; if the worktree contains multiple completed-stream CR tails, do not guess. Require an explicit path or close one target before switching.

3. Build the report slug.
- Prefer an explicit task id when the user gives one.
- Otherwise use a change-scope slug such as `working-tree-YYYYMMDD-HHMM`.

4. Review with a risk-first lens.
- correctness and regression risk
- security, auth, and permission boundaries
- contract and documentation drift
- data consistency, rollback, and failure recovery
- missing or weak tests
- lifecycle and cleanup semantics on cancel / SIGINT / fallback / retry paths

4.2 Build evidence is part of a green closeout, not an optional extra.
- When the reviewed or repaired scope touches executable or typed surfaces under `apps/**`, `packages/**`, `bin/**`, or `test/**`, do not say “完成 / 全绿 / resolved” without one real `pnpm run build` from the same change window.
- Targeted tests and focused gates should still run, but they do not replace the build.
- If the change is docs-only or ledger-only, say explicitly that build was not required because no executable code changed.

4.1 Apply a stricter default bar for “actionable”.
- Do not downgrade a finding to “note only” when it affects fallback selection, retry loops, cancel/SIGINT cleanup, resource release ordering, or other behavior branches that are hard to observe manually.
- Treat missing coverage on non-trivial branches as actionable by default when the branch changes user-visible control flow or runtime safety semantics. Typical examples: confirmation restart loops, downgrade/fallback branches, cancellation, rollback, and cleanup-after-failure.
- Treat cleanup code as actionable when intent is not obvious in lifecycle-sensitive paths (`once` listeners, double-close, unmount/restore, teardown ordering) unless equivalent tests or nearby comments already make the safety argument clear.
- Prefer fixing with the smallest safe patch: add the missing test, add the clarifying comment, or tighten the branch contract. Do not leave these as P3 observations unless you can point to existing coverage or an explicit contract reason.

5. Write the report with this structure.
- Use `code_review_<slug>.md` when findings still need verification or repair.
- Use `resolved_code_review_<slug>.md` directly when no actionable finding exists.
- Keep the file name and top-level `Status` field synchronized.
  - `code_review_<slug>.md` => `Status: review_pending`
  - `verified_code_review_<slug>.md` => `Status: verified`
  - `resolved_code_review_<slug>.md` => `Status: resolved`

```md
# Code Review: <title>

- Status: <review_pending|verified|resolved>
- Date: YYYY-MM-DD
- Reviewer: AI-Agent
- Task: `<task-id-or-n/a>`
- Review Type: working tree review
- Normative References:
  - <docs actually used>

## 1. Review Scope
1. `<file>`

## 2. Findings
### 2.1 [P1] <short finding title>
- 位置: `<file>:<line>`
- 问题描述: <evidence-driven explanation>
- 影响: <user or delivery risk>
- 建议: <actionable repair>

## 3. Notes
1. <constraints, assumptions, residual risk>

## 4. Verification
1. `<command>`（通过/未执行/失败）
```

6. If no actionable issue is found, explicitly write `未发现需要修复的点。`
- Keep residual notes in `## 3. Notes` when useful, but do not leave the report in `review_pending`.
- Skip the pending/verified transition and emit the report directly as `resolved_code_review_<slug>.md` with `Status: resolved`.

## Workflow B: Recheck Pending Report

1. Locate the report.
- Prefer the report path specified by the user.
- Otherwise select the most recently updated `code_review_*.md` in the resolved review target directory.

2. Re-read the current code and relevant docs for every finding.
2.1 During recheck, re-evaluate prior “notes” under the stricter actionable bar above. If a previous report under-classified a real issue, append a new finding id instead of silently rewriting history.

3. Append, do not rewrite, using:

```md
## 复核结论（YYYY-MM-DD）

- 整体结论：**认可 / 部分认可 / 不认可**

### 逐条复核
1. `<finding id>`
   - 判定：**认可**
   - 证据：<current evidence>
   - 处理：<accepted action or reason>

### 验证命令
1. `<command>`（通过/失败/未执行）
```

4. After appending the recheck section, rename `code_review_<slug>.md` to `verified_code_review_<slug>.md` and update the top-level `Status` to `verified`.

## Workflow C: Recheck And Fix

1. Complete Workflow B first.
2. Build a repair list from findings that are `认可`, plus only the accepted sub-items of `部分认可`.
3. Make the smallest safe fix and add or update tests when behavior changes.
4. Append:

```md
## 修复执行记录（YYYY-MM-DD）

1. `<finding id>`：已完成 / 阻塞 / 跳过
   - 变更文件：`<file>`
   - 验证：`<command>`（通过/失败/未执行）
   - 说明：<reason>
```

5. Rename `verified_code_review_<slug>.md` to `resolved_code_review_<slug>.md` only when all actionable items are `已完成`, and update the top-level `Status` to `resolved`.
6. If the resolved directory came from `Worktree Review Target`, and no `code_review_*` / `verified_code_review_*` file remains after this rename, remove `Worktree Review Target` from `current-context.md` in the same change window.
7. If a later stricter recheck discovers a real actionable issue in an already `resolved` report, append a new dated recheck section plus a repair record in place, keep the filename/status synchronized, and only keep `resolved` after the newly discovered item is fixed and re-verified in the same workflow.
8. For code-affecting fixes under `apps/**`, `packages/**`, `bin/**`, or `test/**`, include `pnpm run build` in the verification commands before keeping the report at `resolved`.

## Workflow D: Fix From Verified Report

1. Read the latest `## 复核结论` section first.
2. Do not repair findings from an unverified report.
3. Apply only accepted fixes, append `## 修复执行记录（YYYY-MM-DD）`, and rename to `resolved_code_review_<slug>.md` only if every actionable item is complete; update the top-level `Status` to `resolved` in the same edit.

## Guardrails

1. Never skip `current-context.md`; it is the source of truth for resolved review target routing.
2. Never create or update CR files outside the resolved `review/` directory.
3. Never mark a report as `resolved` while blocked or skipped actionable items remain.
4. Never claim a command passed unless it actually ran successfully.
5. Keep findings evidence-driven, severity-ordered, and tied to concrete file references.
6. When a review has no actionable finding, prefer direct `resolved_code_review_*.md` output over an empty pending lifecycle.
7. Keep user-facing summaries short: findings first, then verification and follow-up actions.
8. Never leave a CR file with mismatched filename/status pairs such as `resolved_code_review_*.md` + `Status: review_pending`.
9. `Worktree Review Target` is optional and singular; use it only for completed streams with open CR tails, and clear it immediately after the last open review artifact is closed.
10. Under the stricter review bar, “missing branch coverage” and “cleanup intent unclear” are not automatically low-priority notes; explicitly justify why they are non-actionable if you decide not to repair them.
11. Never tell the user a code-affecting review or repair is “全绿” without a real `pnpm run build` result from the same change window.
