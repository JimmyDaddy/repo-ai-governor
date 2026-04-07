# TK-622 冻结 first-phase projected rule subset 与 standards source mapping

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. 任务目标

冻结第一阶段进入 standards-native review engine 的 projected rule subset，并明确每条规则与 `code_standards.md`、standards pack 的 source mapping 关系。

## 2. Depends On

1. `TK-621`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 3. 预期产物

1. first-phase projected rule subset 列表
2. `ruleId -> standardsSourceRefs` 映射草案
3. deterministic / standards_guided / manual_only 的初始执行模式建议

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
2. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
3. `packages/standards/src/examples/workflow-review-governance-pack.ts`
4. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/DA-621-standards-native-review-engine-promotion-and-rollout-handoff.md`

## 6. 实施计划

1. 以 `CS-003`、`CS-015`、`CS-021`、`CS-026`、`CS-033`、`CS-034` 为第一阶段候选，明确 rule id、severity、execution mode 与 applicability。
2. 标出当前 native deterministic review 已覆盖、部分覆盖、未覆盖的 standards 面。
3. 为 Sprint 002 的 provenance-aware 实现提供稳定的 projected rule bundle 基线。

## 7. Development Verification

1. 逐条校对 projected subset 是否都能回链到明确的 normative source。
2. 检查 checklist、tasks.csv 与 task card title/status/owner/priority/project/sprint 同步。
3. `pnpm run build`
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-06：在 project-057 多 sprint 拆解中被明确为 first-phase projected rule subset 冻结任务。
3. 2026-04-07：已基于 `ReviewRuleRegistry` 冻结 `CS-003 / CS-015 / CS-021 / CS-026 / CS-033 / CS-034` 的 first-phase projected review-rule subset，并给出 `deterministic / standards_guided / manual_only` 的 Phase A execution mode 边界。
4. 2026-04-07：已产出 `phaseAProjectedReviewRuleBundle` 与对应 source mapping 文档，供 Sprint 002-004 复用相同的 projected rule truth。
5. 2026-04-07：已完成 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check`，当前任务已满足进入 sprint-scoped CR loop 的前置验证。

## 10. 产出

1. `packages/standards/src/examples/phase-a-review-rule-bundle.ts`
2. `packages/standards/test/review-rule-registry.unit.test.ts`
3. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/task-output-tk-622-phase-a-projected-review-rule-subset.md`
