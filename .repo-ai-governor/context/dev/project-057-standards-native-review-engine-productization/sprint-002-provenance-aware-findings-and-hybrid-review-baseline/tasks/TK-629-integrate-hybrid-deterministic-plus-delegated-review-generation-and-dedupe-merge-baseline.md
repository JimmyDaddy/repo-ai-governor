# TK-629 接入 hybrid deterministic-plus-delegated review generation 与 dedupe merge baseline

- Status: planned
- Date: 2026-04-06
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 1. 任务目标

在 `review` 生成路径中增加 deterministic pass 与 delegated pass 的 merge/dedupe seam，为后续 standards-guided reviewer handoff 接入预留正式执行节点。

## 2. Depends On

1. `TK-627`
2. `TK-628`

## 3. 预期产物

1. hybrid review generation baseline
2. delegated finding merge/dedupe 规则
3. uncovered rule coverage gap 的结构化输入位

## 4. Required Inputs

1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/scoped-delegated-cr-loop-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`

## 6. 实施计划

1. 在 review generation 中先执行 deterministic review，再为 uncovered standards surface 预留 delegated pass 接入点。
2. 定义 `ruleId + file + line` 等 dedupe 规则，避免 delegated reviewer 重复转述 deterministic findings。
3. 为 Sprint 003 的 structured reviewer handoff 输出稳定输入 contract。

## 7. Development Verification

1. 检查 merge/dedupe 规则是否保持 canonical review truth 单链路。
2. 检查 hybrid pipeline 是否仍允许在 delegated review 关闭时退化为 deterministic-only path。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：hybrid review generation baseline
2. 待执行：merge/dedupe 规则说明
