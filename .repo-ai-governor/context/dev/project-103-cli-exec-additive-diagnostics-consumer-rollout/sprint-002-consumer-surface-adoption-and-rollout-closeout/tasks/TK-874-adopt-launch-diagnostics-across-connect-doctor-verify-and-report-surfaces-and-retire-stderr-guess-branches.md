# TK-874 adopt launch_diagnostics across connect doctor verify and report surfaces and retire stderr-guess branches

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Sprint: `sprint-002-consumer-surface-adoption-and-rollout-closeout`

## 1. 任务目标

把 `launch_diagnostics` 统一接入 `connect / doctor / verify / report` surfaces，并退役 stderr/error-message 猜测分支。

## 2. Depends On

1. `TK-873`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`

## 3. 预期产物

1. consumer surface adoption plan
2. stderr-guess retirement boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
3. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/review/solution_review_cli-exec-additive-diagnostics-consumer-productization.md`

## 6. 实施计划

1. 将 `launch_diagnostics` 的 consumer surface 映射到 `connect / doctor / verify / report`。
2. 明确退役 stderr-guess branches 的范围，避免双重 truth source。
3. 为 `TK-875` scenario evidence 准备清晰的 consumer-side readback boundary。

## 7. Development Verification

1. 待激活后补充 consumer surface adoption verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：consumer surface adoption artifacts to be defined in rollout window。
