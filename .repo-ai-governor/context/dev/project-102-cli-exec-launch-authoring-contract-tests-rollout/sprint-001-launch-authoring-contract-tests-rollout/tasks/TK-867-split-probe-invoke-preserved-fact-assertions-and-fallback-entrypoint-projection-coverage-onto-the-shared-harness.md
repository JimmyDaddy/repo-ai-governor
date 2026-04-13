# TK-867 split probe invoke preserved-fact assertions and fallback entrypoint projection coverage onto the shared harness

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-001-launch-authoring-contract-tests-rollout`

## 1. 任务目标

把 probe/invoke preserved-fact split 与 fallback entrypoint projection coverage 纳入 shared harness，避免 launch-authoring truth 在 failure-path 中再次漂移。

## 2. Depends On

1. `TK-857`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 3. 预期产物

1. shared harness coverage plan for probe/invoke split
2. fallback entrypoint projection coverage boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-001-launch-authoring-contract-tests-rollout/tasks/TK-857-implement-cli-exec-launch-authoring-contract-tests-rollout-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
3. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`

## 6. 实施计划

1. 将 probe/invoke preserved-fact split 固定到 shared harness，而不是散落在 adapter-local 断言中。
2. 为 fallback resolved entrypoint projection 建立独立 coverage boundary。
3. 激活时为 local `CR-001` 提供清晰的 harness-level review scope。

## 7. Development Verification

1. 待激活后补充 shared harness focused verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：probe/invoke split coverage artifacts to be defined in rollout window。
