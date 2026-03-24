# DA-126 `TK` 单写源与任务模板输入收紧

- Status: active
- Date: 2026-03-24
- Source Task: `TK-128`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 结论

已将 `TK` canonical source 的边界进一步写实，并把任务卡默认输入结构从单一 `Input References` 收敛为 `Required Inputs + Traceback References`。

本轮收口后：

1. `TK` 明确承担任务语义主源角色。
2. `checklist.md` 与 `tasks.csv` 的职责更偏向摘要与机器审计，而不是重复承载任务包。
3. CLI task-driven runtime 对新旧任务卡结构保持双兼容，新任务可以直接使用更窄的默认输入面。

## 2. 本轮调整

### 2.1 task-ledger contract

1. 明确 `project/sprint plan` 只承载范围、里程碑与任务包概览，不是 task-level status 的主写入源。
2. 明确 `checklist.md` 只保留任务可视状态与短执行摘要。
3. 明确 `tasks.csv` 只保留机器审计必需字段，不复制完整 tracebacks 或长输入包。

### 2.2 decomposition template

1. 新任务卡模板默认改为：
   - `## 4. Required Inputs`
   - `## 5. Traceback References`
2. `Required Inputs` 建议控制在 `3-5` 条。
3. 既有任务卡可继续使用 `Input References`，作为迁移兼容形态。

### 2.3 CLI runtime compatibility

1. `task-driven-run-runtime` 先读取 `Required Inputs`。
2. 若不存在 `Required Inputs`，则回退读取旧版 `Input References`。
3. `Traceback References` 被单独解析并保留在 `taskContext` 中，但不进入默认执行输入计数。
4. 已补齐 unit/integration 回归，覆盖新模板与旧模板兼容路径。

## 3. 收口原则

1. 默认执行只消费 `Required Inputs`。
2. `Traceback References` 只服务 handoff、审计、历史追溯与回归定位。
3. 未来若任务卡再次膨胀，应优先移动历史规划、completion audit、rollout notes 到 `Traceback References`。

## 4. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`
