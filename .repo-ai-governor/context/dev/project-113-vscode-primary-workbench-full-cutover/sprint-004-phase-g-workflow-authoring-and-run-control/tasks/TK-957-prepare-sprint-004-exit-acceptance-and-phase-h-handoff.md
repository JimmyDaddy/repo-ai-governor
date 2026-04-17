# TK-957 prepare sprint-004 exit acceptance and phase-h handoff

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-004-phase-g-workflow-authoring-and-run-control`

## 1. 任务目标

写回 Phase G exit evidence、handoff boundary 与 Phase H activation-ready inputs。

## 2. Depends On

1. land workflow studio control surfaces and continuity ux

## 3. 预期产物

1. governance handoff artifact for TK-957
2. task card update for TK-957
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. docs/maintainer-validation-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. docs/local-adoption-playbook.zh-CN.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id TK-957

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id TK-957
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks" --task-id TK-957
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js
6. pnpm run check

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始整理 Phase G exit acceptance 与 Phase H activation-ready inputs；本窗口已完成 workflow studio run-control/continuity 实现，并通过定向 vitest 与 `pnpm run build`，下一步进入 ledger refresh、sprint 门禁与 fresh reviewer round 前的治理收口。
3. 2026-04-17：当前 sprint gate 已 clean 通过：`check-task-required-inputs`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync` 与整仓 `pnpm run check` 已全部通过，Phase G exit acceptance 固定为“workflow studio 现在可直接触发 service-backed run-control / handoff / temporary bridge action，并以 additive continuity section 投影 session metadata；Phase E degraded fallback 与 Phase F secure authoring baseline 均未回退”。
4. 2026-04-17：Phase H handoff 已固定为“从 `.tmp/project-113-boundary-parking/phase-h.patch` 重放 distribution readiness 代码边界，并在 sprint-005 同窗口同步 `apps/vscode-extension/README.md`、`docs/support-matrix.zh-CN.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/maintainer-validation-playbook.zh-CN.md` 的 support-truth wording 与 packaged evidence”；当前任务切换为 `completed`，下一步进入 `CR-001` fresh reviewer round。
5. 2026-04-17：`CR-001` 已完成 accepted finding 修复并进入 `resolved`；当前 `CR-002` 已被激活为 fresh post-fix recheck round，sprint-004 closeout 与 sprint-005 activation 需等待该轮 clean verdict。

## 10. 产出

1. sprint-004 exit acceptance 已具备 delegated CR 准入真值：workflow studio 的 run-control / handoff / temporary bridge / continuity UX 已实装并通过 targeted vitest、build、governance gates 与整仓 `pnpm run check`。
2. Phase H activation-ready inputs 已固定：停车区 `phase-h.patch` 仍可回放，后续 sprint-005 还需要在同一交付窗同步 packaged VSIX evidence 与 support-truth/public-claim docs truth。
3. sprint-004 closeout 当前被 `CR-002` fresh recheck 暂时阻塞；clean reviewer verdict 返回后，当前 handoff 产物可直接承接 sprint-005 activation write-back。
