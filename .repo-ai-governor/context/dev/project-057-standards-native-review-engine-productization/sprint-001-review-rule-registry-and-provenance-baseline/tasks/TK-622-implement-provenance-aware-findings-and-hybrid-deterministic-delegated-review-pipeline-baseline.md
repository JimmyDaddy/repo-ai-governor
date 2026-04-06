# TK-622 冻结 first-phase projected rule subset 与 standards source mapping

- Status: planned
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

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-06：在 project-057 多 sprint 拆解中被明确为 first-phase projected rule subset 冻结任务。

## 10. 产出

1. 待执行：first-phase projected rule subset 清单
2. 待执行：`ruleId -> standardsSourceRefs` mapping 产物
