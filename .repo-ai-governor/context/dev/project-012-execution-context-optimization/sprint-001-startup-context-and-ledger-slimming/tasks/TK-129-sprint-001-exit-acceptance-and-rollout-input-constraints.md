# TK-129 sprint-001 出口验收与 rollout 输入约束

- Status: planned
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 任务目标

汇总 sprint-001 的上下文瘦身证据，完成出口验收，并为后续 review/gate/runtime context follow-up 冻结正式输入约束。

## 2. Depends On

1. `TK-126`
2. `TK-127`
3. `TK-128`

## 3. 预期产物

1. `DA-127` sprint-001 出口验收与 rollout 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/plan.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/plan.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/TK-126-startup-baseline-and-normative-loading-alignment.md`
4. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/TK-127-current-context-active-stream-slimming-and-history-index.md`
5. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/TK-128-task-ledger-single-source-and-tk-template-tightening.md`

## 5. 实施计划

1. 汇总启动基线、active stream、task-ledger/template 三条优化线的实施结论与验证证据。
2. 评估本轮优化对当前主执行流与未来 runtime/review/gate follow-up 的影响边界。
3. 固化 rollout 输入约束，明确后续仍需继续收敛的 review 子链、gate 分层与 runtime memory 注入议题。
4. 产出 `DA-127` 并回写台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-127` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-127-sprint-001-exit-acceptance-and-rollout-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/tasks.csv`
