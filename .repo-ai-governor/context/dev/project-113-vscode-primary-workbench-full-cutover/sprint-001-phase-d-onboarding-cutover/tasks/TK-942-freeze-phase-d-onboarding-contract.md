# TK-942 freeze phase-d onboarding contract

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-001-phase-d-onboarding-cutover`

## 1. 任务目标

冻结 onboarding cutover、readiness evidence 与 VS Code primary workbench onboarding boundary。

## 2. Depends On

1. DA-934

## 3. 预期产物

1. onboarding contract baseline artifact for TK-942
2. task card update for TK-942
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-942

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-942
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-942
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 `project-113 / sprint-001-phase-d-onboarding-cutover` 被激活为 primary stream，当前任务切换为 `in_progress`，开始冻结 Phase D activation contract 与 chat capability probe 边界。
3. 2026-04-17：已将 Phase D contract 收敛为“chat participant 按运行时能力可选注册，`repoAiGovernor.refresh`、tree views、review detail 与 workflow studio provider 仍必须完成 host activation wiring”；当前 contract freeze 已落实到 `apps/vscode-extension/src/runtime/vscode-extension-host.ts`。
4. 2026-04-17：已完成 `pnpm run build` 与 VS Code extension 的 3 个定向 vitest，确认 Phase D activation contract freeze 与 host-level fallback regression 同窗口通过；当前任务切换为 `completed`。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-host.ts` 已冻结 Phase D activation contract：chat participant 改为 capability-detected optional registration，不再阻断 host activation。
2. `current-context.md` 与 sprint-001 计划面已写回 active stream truth，可用于后续 `CR-001` 与 Phase E handoff。
