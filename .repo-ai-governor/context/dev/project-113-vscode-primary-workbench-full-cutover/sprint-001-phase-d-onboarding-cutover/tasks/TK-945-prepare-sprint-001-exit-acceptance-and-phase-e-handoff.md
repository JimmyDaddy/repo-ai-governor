# TK-945 prepare sprint-001 exit acceptance and phase-e handoff

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-001-phase-d-onboarding-cutover`

## 1. 任务目标

写回 Phase D exit evidence、handoff boundary 与 Phase E activation-ready inputs。

## 2. Depends On

1. land onboarding wizard and readiness workbench surfaces

## 3. 预期产物

1. governance handoff artifact for TK-945
2. task card update for TK-945
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. docs/local-adoption-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md
2. docs/maintainer-validation-playbook.zh-CN.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-945

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-945
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-945
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始整理 sprint-001 exit evidence，并为后续 Phase E degraded restore / empty DTO fallback 边界准备 activation-ready handoff。
3. 2026-04-17：已确认当前 sprint-001 只交付 Phase D activation fallback；`phase-e.patch`、`phase-h.patch` 与 out-of-scope governance delta 均继续停放在 `.tmp/project-113-boundary-parking/` 与 path-scoped stash，不参与本 sprint 的 CR 与 boundary commit。
4. 2026-04-17：已完成 `pnpm run build` 与 VS Code extension 的 3 个定向 vitest，当前 exit evidence 足以进入 `CR-001` fresh reviewer round；下一 sprint 将从 clean baseline 重放 `phase-e.patch`，收敛 review detail / workflow studio / queue query 的 degraded fallback 行为。
5. 2026-04-17：当前任务切换为 `completed`，后续只待 `CR-001` clean round 放行，再继续 sprint-001 closeout 与 sprint-002 activation write-back。
6. 2026-04-17：`CR-001 ~ CR-003` 已全部进入 `resolved`，其中 latest fresh reviewer round `CR-003` 返回 clean verdict；当前 sprint-001 已完成 closeout，`current-context.md` 与 project/sprint plan 已切到 sprint-002 / `TK-946` activation truth。

## 10. 产出

1. sprint-001 exit acceptance 已固定为：无 chat API 时扩展仍能激活、`repoAiGovernor.refresh` 等核心命令仍注册、VS Code primary workbench surface 不再被 chat capability 阻断。
2. Phase E handoff 已固定为：从 clean boundary 重放 `.tmp/project-113-boundary-parking/phase-e.patch`，重点收敛 sidecar/query restore failure 到 empty/degraded service-backed view，而不是继续扩展 Phase D 范围。
3. sprint-001 closeout 已完成：`stream-project-113-sprint-001` 已移入 completed history，primary execution surface 已切换到 sprint-002-phase-e-operations-cutover。
