# TK-631 实现 review-verify source-aware closure semantics 与 rationale persistence

- Status: completed
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure`

## 1. 任务目标

让 `review-verify` 在处理 findings 时区分 deterministic、standards-guided 与 risk finding 的 closure 语义，并保留必要的 reviewer rationale。

## 2. Depends On

1. `TK-627`
2. `TK-628`
3. `TK-630`

## 3. 预期产物

1. source-aware review-verify closure 逻辑
2. rationale persistence 约束
3. 同轮 verify 与 fresh recheck 的边界说明

## 4. Required Inputs

1. `apps/cli/src/commands/review-verify-command.ts`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
3. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`

## 6. 实施计划

1. 为 `review-verify` 增加按 `sourceType` 区分的 closure policy 与理由保留逻辑。
2. 保持 deterministic findings 更严格、standards-guided findings 保留 reviewer rationale、risk findings 可审计但可更自由 reject 的语义。
3. 不改变 canonical lifecycle 真值落点，只增强同一条闭环的状态推进语义。

## 7. Development Verification

1. 检查 source-aware closure 是否不会破坏现有 `review_pending -> verified -> resolved` 生命周期。
2. 检查 same-round verify 与 fresh reviewer recheck 的边界是否仍然清晰。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。
2. 2026-04-07：已为 `review-verify` 增加 source-aware per-finding closure records，按 provenance 使用不同 match strategy，并在 verify payload / queued request / lifecycle artifact 中保留 reviewer rationale 与 verification rationale。

## 10. 产出

1. 已完成：source-aware review-verify closure baseline
2. 已完成：reviewer rationale persistence 说明
