# TK-872 project snake_case launch_diagnostics companion from shared producer truth without adding minimum fields

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Sprint: `sprint-001-additive-diagnostics-consumer-rollout`

## 1. 任务目标

从 shared producer truth 投影 snake_case `launch_diagnostics` companion，同时保持 additive-only boundary，不新增 minimum fields。

## 2. Depends On

1. `TK-858`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`

## 3. 预期产物

1. snake_case diagnostics companion projection plan
2. producer-truth to consumer-carrier mapping boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-001-additive-diagnostics-consumer-rollout/tasks/TK-858-implement-cli-exec-additive-diagnostics-consumer-rollout-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
3. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`

## 6. 实施计划

1. 固定 snake_case formal vocabulary 与 implementation carrier 的单向投影关系。
2. 将 top-level preserved facts 与 additive launch evidence 收口到统一 companion boundary。
3. 激活时为 local `CR-001` 提供清晰的 diagnostics-projection review scope。

## 7. Development Verification

1. 待激活后补充 diagnostics companion verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：launch_diagnostics projection artifacts to be defined in rollout window。
