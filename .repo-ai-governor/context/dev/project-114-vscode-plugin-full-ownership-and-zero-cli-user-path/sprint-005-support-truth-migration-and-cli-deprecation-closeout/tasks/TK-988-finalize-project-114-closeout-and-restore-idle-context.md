# TK-988 finalize project-114 closeout and restore idle context

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-005-support-truth-migration-and-cli-deprecation-closeout`

## 1. 任务目标

After the project-final reviewer loop is clean, write the project completion audit, restore `current-context.md` to idle, and capture the final local delivery recommendation for project-114.

## 2. Depends On

1. `TK-987 close sprint-005 boundary and activate project-final reviewer loop`

## 3. 预期产物

1. `project-114` completion audit summary
2. final project / sprint ledger synchronization
3. idle-context restoration note

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
4. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/plan.md
5. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks/TK-987-close-sprint-005-boundary-and-activate-project-final-reviewer-loop.md

## 5. Traceback References

1. .codex/skills/workspace-scoped-cr-loop/SKILL.md
2. .codex/skills/workspace-delivery-finisher/SKILL.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 写入 `project-114` completion audit summary，并将项目与 final sprint 计划面恢复到 completed 真值。
2. 同步 canonical task ledger、rendered checklist/CSV 与 completed history。
3. 将 `current-context.md` 恢复为 `idle`，并记录最终本地 commit 建议。

## 7. Development Verification

1. node ./scripts/governance/check-task-ledger-sync.js
2. node ./scripts/governance/check-sprint-plan-status-sync.js

## 8. Delivery Verification

1. node ./scripts/governance/check-task-ledger-sync.js
2. node ./scripts/governance/check-sprint-plan-status-sync.js
3. node ./scripts/governance/check-code-review-status-sync.js
4. node ./scripts/governance/check-worktree-review-target.js
5. pnpm run check

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：project-final delegated reviewer loop 在 `CR-009` clean 收口，machine-readable findings 为 `[]`；随后写入 `project-114` completion audit summary，将 project / sprint 计划面恢复为 `completed`，并把 `current-context.md` 恢复到 idle。
3. 2026-04-18：本次 closeout delta 仅包含治理台账、completion audit 与上下文恢复；未再修改 `apps/**`、`packages/**`、`scripts/**` 或 `test/**` 的可执行代码，因此沿用 `CR-009` 同窗口的真实 `pnpm run build` 证据，并额外重跑 task-ledger / review / worktree gates 与 `pnpm run check` 后将当前任务切换为 `completed`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path-completion-audit-summary.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
