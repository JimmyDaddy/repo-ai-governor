# TK-621 冻结 standards-native review rule registry 与 finite-set finding taxonomy contract

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. 任务目标

冻结 `ReviewRuleDefinition`、`ReviewRuleExecutionMode`、`ReviewFindingSourceType`、`ReviewRuleSeverity`、`ReviewRuleApplicability` 等闭集业务值与 registry contract，让后续实现阶段不再继续漂移出多套 finding 语义。

## 2. Depends On

1. `technical-solution.standards-native-code-review-engine-follow-up` promotion accepted
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`

## 3. 预期产物

1. review rule registry 最小 contract 草案
2. finite-set enum/constants 管理边界说明
3. Phase A 必须冻结的 finding taxonomy 清单

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
4. `packages/standards/src/examples/workflow-review-governance-pack.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/DA-621-standards-native-review-engine-promotion-and-rollout-handoff.md`

## 6. 实施计划

1. 收口 review rule registry 的字段边界，并标出哪些字段必须持久化到 canonical review artifact。
2. 把 `sourceType`、`executionMode`、`severity`、`applicability` 等闭集值收口为 enum/constants 管理要求，避免后续以 inline union 或 magic literals 重复定义。
3. 输出给 Sprint 002-004 复用的 contract freeze 清单。

## 7. Development Verification

1. 对照 ADR 与 draft 检查 registry/finding taxonomy 是否仍保持单一事实面。
2. 校对 task ledger 文案与 task card title/status/owner/priority/project/sprint 一致。
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
2. 2026-04-06：在 project-057 多 sprint 拆解中被明确为 Phase A contract freeze 首任务。
3. 2026-04-07：`project-055` final closeout 完成后被激活为 `in_progress`，作为 `project-057 / sprint-001` 的首个执行边界。
4. 2026-04-07：已在 `packages/standards` 中新增 review-rule finite-set 常量、专属 interface contract 与 `ReviewRuleRegistry`，并把 Phase A 的 finding taxonomy 与 canonical artifact fields 写入独立 task output。
5. 2026-04-07：已完成 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check`，当前实现窗口已满足进入 sprint-scoped CR loop 的前置验证。

## 10. 产出

1. `packages/standards/src/constants/review-rule.constant.ts`
2. `packages/standards/src/types/interfaces/review-rule.interface.ts`
3. `packages/standards/src/review-rule-registry.ts`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/task-output-tk-621-review-rule-registry-contract-freeze.md`
