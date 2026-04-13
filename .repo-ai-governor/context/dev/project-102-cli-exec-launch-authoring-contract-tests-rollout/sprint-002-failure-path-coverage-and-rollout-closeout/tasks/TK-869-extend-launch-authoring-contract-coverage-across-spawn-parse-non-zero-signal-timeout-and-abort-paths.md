# TK-869 extend launch-authoring contract coverage across spawn parse non-zero signal timeout and abort paths

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Sprint: `sprint-002-failure-path-coverage-and-rollout-closeout`

## 1. 任务目标

把 launch-authoring contract coverage 扩展到主要 failure-path，确保 authoring truth 在 shared runtime 的异常路径中仍被保住。

## 2. Depends On

1. `TK-868`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 3. 预期产物

1. failure-path coverage expansion plan
2. launch-authoring regression evidence boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
3. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`

## 6. 实施计划

1. 将 spawn、parse、non-zero、signal、timeout、abort 路径映射到 shared launch-authoring contract coverage。
2. 固定 failure-path 下 authoring truth 与 preserved facts 的读法。
3. 为 `TK-870` 的 compatibility alignment evidence 准备清晰输入。

## 7. Development Verification

1. 待激活后补充 failure-path coverage verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：failure-path coverage artifacts to be defined in rollout window。
