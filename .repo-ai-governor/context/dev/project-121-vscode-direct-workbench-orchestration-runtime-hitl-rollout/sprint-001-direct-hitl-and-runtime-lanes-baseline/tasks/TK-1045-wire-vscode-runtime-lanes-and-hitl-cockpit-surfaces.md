# TK-1045 wire vscode runtime lanes and hitl cockpit surfaces

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-001-direct-hitl-and-runtime-lanes-baseline`

## 1. 任务目标

让 VS Code 插件直接消费 `role_lane_status / session_continuity / hitl_decision_packet`，把 Runtime Lanes 与 HITL Decision Cockpit 从 coarse queue/evidence-only surface 推进为 direct-workbench runtime/presentation baseline。

## 2. Depends On

1. `TK-1044`

## 3. 预期产物

1. vscode extension service runtime 对 direct-workbench query 的消费增量
2. runtime lanes / HITL cockpit presentation 与 surface interface 增量
3. 面向 vscode surface 的 targeted smoke/regression coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/TK-1044-implement-role-lane-status-and-hitl-decision-query-runtime.md`
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
5. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
3. `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 在 extension service runtime 中新增对 runtime lane status、session continuity 与 hitl decision packet 的查询与 snapshot 组装。
2. 更新 workflow studio provider、presentation builder 与 surface interface，使 runtime lanes / HITL cockpit 展示完整 risk facts、SLA、default timeout action 与 backlinks。
3. 为 direct-workbench vscode surfaces 补齐 targeted smoke/regression coverage，并确保 selection store 仍只保存 transient UI selection。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run check:ide-entry-smoke`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:desktop-entry-smoke`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-22：扩展 VS Code workflow-studio snapshot，直接消费 `roleLaneStatus / sessionContinuity / hitlDecisionPacket` 的 service-owned projection，并保留 `selection store` 只持有 transient selection。
3. 2026-04-22：更新 workflow-studio presentation sections，使 `Runtime Lanes` 与 `HITL Decision Packet` 独立展示，而不再把 queue summary 误当成 runtime lane truth。
4. 2026-04-22：执行 `pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`，验证 extension runtime/presentation 回归通过。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
3. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
4. `apps/vscode-extension/src/types/interfaces/index.ts`
5. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
6. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
