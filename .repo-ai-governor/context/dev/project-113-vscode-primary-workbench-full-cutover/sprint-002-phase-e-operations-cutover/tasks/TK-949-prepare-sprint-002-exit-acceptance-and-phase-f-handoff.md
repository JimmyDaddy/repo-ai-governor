# TK-949 prepare sprint-002 exit acceptance and phase-f handoff

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-002-phase-e-operations-cutover`

## 1. 任务目标

写回 Phase E exit evidence、handoff boundary 与 Phase F activation-ready inputs。

## 2. Depends On

1. land operations workbench surfaces and bridge fallback governance

## 3. 预期产物

1. governance handoff artifact for TK-949
2. task card update for TK-949
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. docs/maintainer-validation-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. docs/local-adoption-playbook.zh-CN.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-949

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-949
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-949
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始整理 sprint-002 exit evidence，并为 Phase F secure authoring / settings / secret readiness handoff 准备 activation-ready inputs。
3. 2026-04-17：已确认当前 sprint-002 只交付 Phase E degraded fallback；Phase H patch 继续停放在 `.tmp/project-113-boundary-parking/phase-h.patch`，Phase F / G 仍保持 clean baseline，不把 secure authoring 或 workflow authoring 范围提前混入本 sprint。
4. 2026-04-17：已完成 `pnpm run build` 与 2 个 VS Code extension 定向 vitest，当前 exit evidence 足以进入 sprint-002 `CR-001` fresh reviewer round；下一 sprint 将从 clean baseline实现 secure authoring、user settings 与 secret readiness UX。
5. 2026-04-17：当前任务切换为 `completed`，后续只待 `CR-001` clean round 放行，再继续 sprint-002 closeout 与 sprint-003 activation write-back。
6. 2026-04-17：`CR-001` 已接受并修复 artifact-pane restore failure 假空态与 HITL fallback 证据缺口；sprint-002 exit evidence 现已回到“queue/execution/HITL empty DTO + review detail/workflow studio degraded restore page” 的一致口径，等待 fresh recheck round 放行。
7. 2026-04-17：`CR-002 ~ CR-003` 已全部进入 `resolved`，其中 latest clean recheck round 未发现新增 actionable finding；当前 sprint-002 已完成 closeout，`current-context.md` 与 project/sprint plan 已切到 sprint-003 / `TK-950` activation truth。

## 10. 产出

1. sprint-002 exit acceptance 已固定为：queue/execution/HITL query failure 返回 empty DTO，review detail 与 workflow studio restore failure 渲染 degraded-but-restorable page，而不是无限 loading 或直接抛错。
2. Phase F handoff 已固定为：从 clean baseline 开始实现 secure authoring、user settings 与 secret readiness，不复用或扩展 Phase E 的 degraded fallback 代码路径。
3. sprint-002 closeout 已完成：`stream-project-113-sprint-002` 已移入 completed history，primary execution surface 已切换到 sprint-003-phase-f-secure-authoring-and-user-settings。
