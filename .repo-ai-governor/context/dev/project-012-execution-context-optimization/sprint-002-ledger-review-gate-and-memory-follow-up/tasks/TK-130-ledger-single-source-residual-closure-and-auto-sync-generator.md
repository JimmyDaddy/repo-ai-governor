# TK-130 `TK` 单写源残余收口与自动同步生成器

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-002-ledger-review-gate-and-memory-follow-up`

## 1. 任务目标

将 `TK` 单写源从“契约 + 人工回写 + drift gate”进一步收口为更接近真实 canonical source 的执行机制，并减少 project/sprint plan 中的 task 级重复状态维护。

## 2. Depends On

1. `TK-129`

## 3. 预期产物

1. `DA-128` `TK` 单写源残余收口与自动同步生成器产物文档。

## 4. Required Inputs

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
4. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-126-task-ledger-single-source-and-tk-template-tightening.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-042-task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/project-012-execution-context-optimization-completion-audit-summary.md`

## 6. 实施计划

1. 明确分析稿中“部分完成”的剩余口径，尤其是 plan 级重复状态矩阵与人工回写依赖。
2. 设计并实现从 `TK` 派生 `checklist/tasks.csv` 的自动同步或生成机制。
3. 收紧 project/sprint plan 的 task 级重复状态表达，退化为任务包概览。
4. 补齐 `DA-128`、验证与台账回写。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，开始实现 `scripts/governance/sync-task-ledger.js`，并同步收紧 project/sprint plan 的 task-level status 表达。
3. 2026-03-24：任务完成，已交付 canonical `TK -> checklist/tasks.csv` 同步器，并将 `project-012` 的 project/sprint plan 状态表达收敛为 ledger-derived overview。
4. 2026-03-24：复核 follow-up CR 后，已将 checklist 派生逻辑收紧为“以 canonical `TK` 执行记录为基线，只追加当前同步请求的 `checklistNote`”，并将工作树 CR 收尾为 `resolved`。

## 10. 产出

1. `DA-128` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/DA-128-ledger-single-source-residual-closure-and-auto-sync-generator.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/tasks.csv`
