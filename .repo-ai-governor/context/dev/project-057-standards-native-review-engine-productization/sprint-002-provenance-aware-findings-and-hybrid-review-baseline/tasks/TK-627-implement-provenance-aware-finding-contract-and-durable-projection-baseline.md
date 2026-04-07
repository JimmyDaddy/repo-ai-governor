# TK-627 实现 provenance-aware finding contract 与 durable projection baseline

- Status: in_progress
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 1. 任务目标

把 governed review finding 扩展为 provenance-aware contract，并明确哪些字段进入 durable projection、哪些字段仅作为 runtime execution cache。

## 2. Depends On

1. `TK-621`
2. `TK-622`

## 3. 预期产物

1. provenance-aware finding contract
2. durable projection 字段边界说明
3. finding source type 与 execution mode 的落盘策略

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
2. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
3. `apps/cli/src/constants/cli-review.constant.ts`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
2. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`

## 6. 实施计划

1. 为 finding model 增加 `ruleId/sourceType/executionMode/severity` 等 provenance-aware 字段。
2. 明确 canonical review artifact、transport artifact 与 runtime diagnostics 各自承载的字段边界。
3. 保持与现有 `CR-xxx` / `review-verify` 生命周期兼容，不额外创建平行 review truth。

## 7. Development Verification

1. 定向校对 finding contract 是否满足 deterministic、standards-guided、risk finding 三类来源需求。
2. 校对新增闭集业务值是否遵守 `CS-009` 与 `CS-032`。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：`sprint-001` closeout 完成后被激活为 `in_progress`，作为 `project-057 / sprint-002` 的首个执行边界。

## 10. 产出

1. 待执行：provenance-aware finding contract
2. 待执行：durable projection boundary 说明
