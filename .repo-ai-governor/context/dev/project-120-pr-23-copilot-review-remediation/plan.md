# project-120-pr-23-copilot-review-remediation 计划

- Status: active
- Date: 2026-04-21
- Stage Mapping: pr remediation
- Phase Mapping: GitHub PR #23 unresolved copilot review thread remediation
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.codex/skills/gh-pr-remediation/SKILL.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. 目标

1. 处理 PR #23 上当前 unresolved 的 copilot review threads。
2. 只修复经本地复核后成立的 review feedback，并保留对不成立评论的明确处置边界。
3. 在本地验证、推送更新后，重新抓取 PR 状态并只 resolve 已真正闭环的 review threads。

## 2. Sprint 细化

## 2.1 sprint-001-unresolved-thread-fix-and-pr-recheck

- Status: active
- Sprint Goal: 修复 PR #23 中成立的 reviewer feedback，并完成 PR 状态复查与线程收口。
- Task Package: `TK-1033`、`TK-1034`、`TK-1035`、`TK-1036`、`CR-001`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1033 | sprint-001 | remediate valid copilot review findings for pr-23 | code-fix/docs-fix | project-119 closeout | in_progress |
| TK-1034 | sprint-001 | verify pr-23 remediation locally and push updated branch | verification/delivery | TK-1033 | planned |
| TK-1035 | sprint-001 | recheck github pr status and resolve addressed threads | pr-recheck/review-thread-closure | TK-1034 | planned |
| TK-1036 | sprint-001 | finalize project-120 closeout and restore idle context | closeout/final-audit | TK-1035、CR-001 | planned |
| CR-001 | sprint-001 | review project-120 pr remediation window | review | TK-1033、TK-1034 | review_pending |

## 4. 依赖产物策略

1. 以 GitHub PR 快照中的 unresolved threads 为 triage 起点，但是否修复仍以本地代码与仓库规范复核为准。
2. 若 reviewer comment 只指出潜在风险而当前实现已有更直接真值来源，则允许采用更小的仓库内一致性修复，而不是机械照搬 suggestion。
3. resolve review thread 只能发生在修复代码已 push 且 fresh PR snapshot 确认 delta 之后。

## 5. DoD（project-120）

1. PR #23 中经复核成立的 reviewer feedback 已修复并 push。
2. 本地相关验证与 `pnpm run check` 已通过。
3. `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status` 已重新抓取，required checks 没有新的 failing/pending blocker。
4. 已闭环的 review threads 被 resolve，未闭环线程保持未 resolve 并明确记录原因。
5. review artifact、completion audit、completed history 和 idle context 已同步收口。

## 6. 里程碑记录

1. 2026-04-21：创建 `project-120` 单 sprint PR remediation stream，并将 `TK-1033` 激活为当前执行边界。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 `project-120-pr-23-copilot-review-remediation-completion-audit-summary.md`。
