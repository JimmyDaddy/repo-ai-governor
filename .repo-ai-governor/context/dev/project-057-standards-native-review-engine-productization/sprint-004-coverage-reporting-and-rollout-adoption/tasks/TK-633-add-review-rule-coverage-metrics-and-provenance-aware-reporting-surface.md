# TK-633 增加 review rule coverage metrics 与 provenance-aware reporting surface

- Status: planned
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-004-coverage-reporting-and-rollout-adoption`

## 1. 任务目标

让产品可以表达当前 review surface 对 repository governance 的真实覆盖率，而不是继续输出一份来源混杂的 finding 列表。

## 2. Depends On

1. `TK-629`
2. `TK-631`

## 3. 预期产物

1. review rule coverage metrics baseline
2. provenance-aware reporting surface 方案
3. coverage gap 展示口径

## 4. Required Inputs

1. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
3. `apps/cli/src/commands/review-command.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure/plan.md`

## 6. 实施计划

1. 定义 total active rules、deterministic coverage、standards-guided coverage、manual-only gap 等指标。
2. 决定 coverage metrics 在 artifact、CLI 或 future client 中的最小呈现面。
3. 保证 metrics 依赖 projected rule bundle 与 provenance-aware findings，而不是新的平行真值。

## 7. Development Verification

1. 检查 metrics 是否能真实反映规则覆盖面，而非重复统计 finding 数量。
2. 检查 reporting surface 是否仍以 canonical review lifecycle 为中心。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：coverage metrics baseline
2. 待执行：provenance-aware reporting surface 说明
