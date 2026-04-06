# TK-628 更新 deterministic finding rule projection 与 review artifact rendering sections

- Status: planned
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 1. 任务目标

让现有 deterministic findings 获得正式 `ruleId/sourceType` 身份，并把 canonical review artifact 渲染成按 provenance-aware finding class 分区的结构。

## 2. Depends On

1. `TK-627`

## 3. 预期产物

1. deterministic finding rule projection
2. review artifact section rendering 更新
3. finding class 对应的展示文案/结构约束

## 4. Required Inputs

1. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
2. `apps/cli/src/commands/review-command.ts`
3. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/plan.md`

## 6. 实施计划

1. 把现有 deterministic heuristic findings 投影到明确的 `ruleId` 与 `sourceType=deterministic_rule`。
2. 调整 review artifact 渲染结构，分离 deterministic、standards-guided 与 residual risk sections。
3. 保证 artifact 更新不会破坏既有 `review -> review-verify` 生命周期文件名与状态语义。

## 7. Development Verification

1. 检查 deterministic findings 是否不再以匿名 heuristic 形式落地。
2. 检查 artifact sections 是否与 provenance-aware finding taxonomy 一致。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：artifact rendering update
2. 待执行：deterministic finding rule projection 说明
