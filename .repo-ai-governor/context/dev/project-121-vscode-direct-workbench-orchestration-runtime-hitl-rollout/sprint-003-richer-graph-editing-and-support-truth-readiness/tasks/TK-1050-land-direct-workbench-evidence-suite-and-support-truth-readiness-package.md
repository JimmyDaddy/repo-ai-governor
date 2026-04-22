# TK-1050 land direct-workbench evidence suite and support-truth readiness package

- Status: planned
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-003-richer-graph-editing-and-support-truth-readiness`

## 1. 任务目标

补齐 direct-workbench 的 build/distribution/runtime evidence suite 与 support-truth readiness package，让 sprint-003 可以基于真实验证信号而不是 contract-only formalization 来决定是否增强 public claim。

## 2. Depends On

1. `TK-1049`

## 3. 预期产物

1. direct-workbench evidence matrix 与 regression coverage plan
2. vscode extension / host distribution verification package
3. 提供给 `TK-1041` 的 support-truth readiness package

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/TK-1049-implement-richer-graph-editing-and-projection-backed-workflow-studio.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`
3. `package.json`
4. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 6. 实施计划

1. 为 direct-workbench workflow studio、runtime lanes 与 HITL cockpit 补齐 build/distribution/runtime evidence matrix 与 regression coverage。
2. 收敛 `release:verify-vscode-extension-distribution`、`release:verify-host-distribution` 与相关 smoke/gate 输出，形成 fail-closed readiness package。
3. 将 readiness package 回链到 delivery registry / sprint closeout 所需的 evidence boundary。

## 7. Development Verification

1. `pnpm run check:ide-entry-smoke`
2. `pnpm run check:desktop-entry-smoke`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run release:verify-vscode-extension-distribution`
3. `pnpm run release:verify-host-distribution`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：direct-workbench evidence matrix and regression coverage updates
2. 待执行：vscode extension / host distribution verification records
3. 待执行：support-truth readiness package for `TK-1041`
