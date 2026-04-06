# TK-623 收口 Phase A integration seam inventory 与 acceptance baseline

- Status: planned
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. 任务目标

明确 Phase A 结束后进入 Sprint 002-004 的模块落点、依赖顺序、验收信号与交付闸口，避免后续按“先写代码再补 contract”方式推进。

## 2. Depends On

1. `TK-621`
2. `TK-622`

## 3. 预期产物

1. runtime integration seam inventory
2. Sprint 002-004 依赖与排序说明
3. project-057 phase-by-phase acceptance baseline

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
3. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
4. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/DA-621-standards-native-review-engine-promotion-and-rollout-handoff.md`
2. `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`

## 6. 实施计划

1. 识别 `runtime.orchestration`、`runtime.durable-storage`、`runtime.agent-projection`、`runtime.cli-interactive-shell` 在 project-057 中各自承接的实现责任。
2. 为 Sprint 002-004 输出模块切入点、需要保留的 canonical truth 边界与不能跨越的副作用边界。
3. 定义每个 sprint 的 exit criteria 与 closeout 顺序，避免把 coverage reporting 和 rollout policy 混入前置 contract 设计窗口。

## 7. Development Verification

1. 检查 integration seam inventory 是否覆盖 review generation、review-verify、delegated handoff、reporting 四条主链。
2. 检查 phase sequencing 是否与 ADR 和 follow-up draft 保持一致。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-06：在 project-057 多 sprint 拆解中被明确为 Phase A acceptance baseline 收口任务。

## 10. 产出

1. 待执行：Phase A integration seam inventory
2. 待执行：Sprint 002-004 acceptance baseline
