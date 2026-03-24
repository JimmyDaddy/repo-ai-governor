# TK-127 `current-context` 活跃流瘦身与历史索引分层

- Status: planned
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 任务目标

将 `current-context.md` 从“活跃流 + 历史目录索引”的混合状态收敛为更聚焦的 active stream 入口，并建立 completed stream 的历史索引分层。

## 2. Depends On

1. `TK-126`

## 3. 预期产物

1. `DA-125` `current-context` 活跃流瘦身与历史索引分层产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
2. `.repo-ai-governor/context/current-context.md`
3. `scripts/governance/check-task-ledger-sync.js`
4. `scripts/governance/check-sprint-plan-status-sync.js`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`

## 5. 实施计划

1. 定义 active stream 与 completed/history stream 的最小表达边界，避免所有历史流继续常驻默认入口。
2. 调整 `current-context` 的结构或伴随索引文件，确保当前任务优先关注 primary 与并行活跃流。
3. 同步修正直接消费 `current-context` 的治理脚本，保证瘦身后仍可通过台账与状态门禁。
4. 补齐历史索引与 `DA-125`，并回写台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-125` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-125-current-context-active-stream-slimming-and-history-index.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/tasks.csv`
