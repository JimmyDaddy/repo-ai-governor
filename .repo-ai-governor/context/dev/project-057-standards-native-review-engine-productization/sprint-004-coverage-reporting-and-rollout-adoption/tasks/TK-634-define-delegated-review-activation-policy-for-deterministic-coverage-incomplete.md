# TK-634 定义 deterministic coverage incomplete 的 delegated review activation policy

- Status: planned
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-004-coverage-reporting-and-rollout-adoption`

## 1. 任务目标

定义当 deterministic coverage 无法覆盖当前 scope 的 standards surface 时，何时必须开启 delegated review、何时可以保持可选，并把该策略对齐到后续 adopter-facing rollout。

## 2. Depends On

1. `TK-633`

## 3. 预期产物

1. delegated review activation policy
2. coverage incomplete 的决策口径
3. rollout 阶段的默认/显式开启建议

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
2. `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`
3. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`

## 6. 实施计划

1. 用 coverage metrics 判断 delegated review 是 required、recommended 还是 optional。
2. 明确 policy 只约束 activation，不改变 canonical review truth 或 source-aware closure semantics。
3. 为 adopter-facing `run --review-loop delegated` 的产品路径准备默认策略说明。

## 7. Development Verification

1. 检查 activation policy 是否与 PRD 中“目标仓库治理正确性优先”保持一致。
2. 检查 policy 是否不会把弱推理伪装成硬规则强制失败。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：delegated review activation policy
2. 待执行：coverage incomplete 决策说明
