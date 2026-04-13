# TK-861 establish native cli_exec scenario-class compatibility harness and preserved-facts assertions

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-001-compatibility-taxonomy-and-regression-harness`

## 1. 任务目标

建立 native `cli_exec` scenario-class compatibility harness 与 preserved-facts assertions，作为 compatibility/stability rollout 的基础实现面。

## 2. Depends On

1. `DA-842`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`

## 3. 预期产物

1. compatibility scenario-class harness implementation boundary
2. preserved-facts assertion matrix and execution notes
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/tasks/DA-842-cli-exec-compatibility-and-stability-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
4. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`

## 6. 实施计划

1. 将 scenario class 与 required preserved facts 拆成可执行的 harness 与 assertion entrypoint。
2. 固定 shared runtime、adapter projection 与 partial-output / terminate-phase 语义的回归断言面。
3. 激活时同步 task ledger、checklist、tasks.csv，并为后续 local `CR-001` 留出清晰 review boundary。

## 7. Development Verification

1. 待激活后补充 compatibility harness focused verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：compatibility harness artifacts to be defined in rollout window。
