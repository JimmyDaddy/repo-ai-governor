# TK-962 close sprint-005 boundary and activate project-final reviewer loop

- Status: `in_progress`
- Date: 2026-04-18
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 1. 任务目标

在 sprint-005 全部 `TK/CR` 进入终态后，完成本 sprint 的最终 gate、boundary-level local commit 与 project-final fresh reviewer loop bootstrap，并把 active execution surface 保持为 project-final closeout-ready 真值。

## 2. Depends On

1. `TK-961 prepare project-final closeout and next-stream recommendation`
2. `CR-007 sprint-005-phase-h-support-promotion-and-distribution-readiness delegated recheck loop round 7`

## 3. 预期产物

1. sprint-005 closeout-ready plan/current-context write-back
2. sprint-005 boundary-level local commit
3. project-final fresh reviewer round bootstrap artifact

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md
5. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/review/resolved_code_review_working-tree-20260418-0150.md

## 5. Traceback References

1. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md
2. .codex/skills/workspace-scoped-cr-loop/SKILL.md
3. .codex/skills/workspace-delivery-finisher/SKILL.md

## 6. 实施计划

1. 将 sprint-005 的 clean review 结果写回 active context 与 plan surfaces，标记为 closeout-ready。
2. 运行 sprint-005 最终 delivery gate，并确认 boundary commit staging scope。
3. 创建本地 sprint-005 boundary commit：`feat(project-113-sprint-005): complete sprint and clear cr loop`。
4. bootstrap project-final fresh reviewer loop，同时保持 sprint-005 作为 active closeout surface 直到 project-final CR 收口。

## 7. Development Verification

1. pnpm run check
2. git status --short

## 8. Delivery Verification

1. pnpm run check
2. node ./scripts/governance/check-task-ledger-sync.js
3. node ./scripts/governance/check-sprint-plan-status-sync.js
4. node ./scripts/governance/check-code-review-status-sync.js
5. node ./scripts/governance/check-worktree-review-target.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `in_progress`；当前 sprint-005 的 `CR-007` clean round 已返回无 actionable finding，下一步执行 sprint final gate、boundary commit 与 project-final reviewer bootstrap。

## 10. 产出

1. 待执行：sprint-005 closeout-ready write-back
2. 待执行：`feat(project-113-sprint-005): complete sprint and clear cr loop`
3. 待执行：project-final reviewer bootstrap artifact
