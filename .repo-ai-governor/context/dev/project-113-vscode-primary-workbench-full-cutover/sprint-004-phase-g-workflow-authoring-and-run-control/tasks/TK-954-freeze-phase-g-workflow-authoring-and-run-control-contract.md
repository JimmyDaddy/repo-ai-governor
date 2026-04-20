# TK-954 freeze phase-g workflow authoring and run-control contract

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-004-phase-g-workflow-authoring-and-run-control`

## 1. 任务目标

冻结 workflow authoring、run-control 与 workflow studio continuity boundary。

## 2. Depends On

1. prepare sprint-003 exit acceptance and phase-g handoff

## 3. 预期产物

1. workflow authoring contract artifact for TK-954
2. task card update for TK-954
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id TK-954

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id TK-954
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id TK-954
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-003 在 `CR-002` resolved round 后完成 closeout，当前任务已切换为 `in_progress`，开始从 clean baseline 冻结 workflow authoring、governed run-control 与 workflow studio continuity boundary，并显式保持 Phase E degraded fallback 与 Phase F secure-authoring contract 不回退。
3. 2026-04-17：当前边界已正式冻结为“workflow studio 继续只消费 service-owned DTO / query / command seam，但允许在 webview 内直接触发 governed run-control、handoff 与 temporary-bridge authoring affordance；session continuity 通过 `executionSessionId -> getSession / resumeSession` 投影，不引入 extension-local runtime truth”，同窗口定向 vitest 与 `pnpm run build` 已通过，当前任务切换为 `completed`。

## 10. 产出

1. Phase G contract 已固定为：workflow studio 从只读证据页提升为 service-backed actionable surface，但 run-control、handoff、temporary bridge 与 continuity metadata 仍全部复用既有 command/query seam，不新增本地 shadow state。
2. continuity contract 已固定为：`sessionId / currentRouteId / latestTurnId / latestEventSequence / nextCursor / resumeSelector` 只作为 additive continuity projection 进入 workflow studio；`resumeSession` 失败时仅降级 continuity 区块，不放大为整个 workflow studio restore failure。
