# TK-132 gate 分层模板化与开发交付验证契约

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-002-ledger-review-gate-and-memory-follow-up`

## 1. 任务目标

让 `Fast Gate / Release Gate` 真正进入任务模板与执行契约，明确开发验证与交付验证边界，避免所有任务默认携带完整 release gate 心智负担。

## 2. Depends On

1. `TK-129`

## 3. 预期产物

1. `DA-130` gate 分层模板化与开发交付验证契约产物文档。

## 4. Required Inputs

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
4. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-127-sprint-001-exit-acceptance-and-rollout-input-constraints.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`

## 6. 实施计划

1. 对齐 gate layering spec 与当前任务模板的缺口。
2. 将任务卡模板拆分为开发验证与交付验证语义。
3. 明确状态切换与交付窗口下的 gate 触发边界。
4. 补齐 `DA-130`、验证与台账回写。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，开始将 Fast Gate / Release Gate 映射回任务模板、执行协议与 plan 语义。
3. 2026-03-24：任务完成，任务模板已拆成 `Development Verification / Delivery Verification`，并在规范与 project-012 plan 中明确了 ledger-derived status source。

## 10. 产出

1. `DA-130` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/DA-130-gate-layering-template-and-dev-delivery-verification-contract.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/tasks.csv`
