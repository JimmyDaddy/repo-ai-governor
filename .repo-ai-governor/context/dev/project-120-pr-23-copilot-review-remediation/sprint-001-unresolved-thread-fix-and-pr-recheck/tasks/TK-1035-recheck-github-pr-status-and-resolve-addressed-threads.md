# TK-1035 recheck github pr status and resolve addressed threads

- Status: planned
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-120-pr-23-copilot-review-remediation`
- Sprint: `sprint-001-unresolved-thread-fix-and-pr-recheck`

## 1. 任务目标

在 push 后重新抓取 PR #23 状态，并 resolve 已明确闭环的 review threads。

## 2. Depends On

1. `TK-1034`

## 3. 预期产物

1. fresh PR snapshot
2. 已 resolve 的 GitHub review thread ids

## 4. Required Inputs

1. `.codex/skills/gh-pr-remediation/scripts/github_pr_tool.py`
2. PR #23 thread ids
3. fresh pushed branch state

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/plan.md`

## 6. 实施计划

1. 重新运行 `github_pr_tool.py status`。
2. 仅对已真正闭环的 thread 调用 `resolve-thread`。
3. 把 remaining unresolved thread / checks 状态写回 closeout 面。

## 7. Development Verification

1. python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status

## 8. Delivery Verification

1. python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：rechecked PR snapshot and resolved thread records
