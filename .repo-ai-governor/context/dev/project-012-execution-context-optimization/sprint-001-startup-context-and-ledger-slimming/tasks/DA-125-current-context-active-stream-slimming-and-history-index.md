# DA-125 `current-context` 活跃流瘦身与历史索引分层

- Status: active
- Date: 2026-03-24
- Source Task: `TK-127`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 结论

已将 `.repo-ai-governor/context/current-context.md` 收敛为只承载当前默认执行入口，并把已完成 streams 迁移到独立历史索引。

本轮收口后：

1. 默认启动只看到 primary 与 active parallel streams。
2. completed streams 不再常驻 `current-context.md`。
3. `check-task-ledger-sync.js` 会强制 `## Active Streams` 只能包含 active 状态条目。

## 2. 本轮调整

### 2.1 `current-context.md`

1. `## Active Streams` 现在只保留：
   - `primary`
   - 仍在进行中的并行 stream
2. 新增 `## Completed Stream History` 指向独立历史索引文件。
3. 在 update rules 中明确：stream 收尾时必须从 `Active Streams` 迁移到 history。

### 2.2 `completed-streams-history.md`

1. 新增 `.repo-ai-governor/context/completed-streams-history.md`。
2. 承接此前混在 `current-context.md` 中的 completed streams。
3. 明确该文件只用于 traceback、迁移、审计与回归定位，不作为默认启动上下文。

### 2.3 `check-task-ledger-sync.js`

1. 解析范围从“扫描整个 `current-context.md`”收紧为只扫描 `## Active Streams`。
2. 只要 `## Active Streams` 中出现 `status=completed`、`missing` 或其他非 active 状态，gate 直接 fail。
3. 这样 completed stream 无法再悄悄留在默认入口里。

## 3. 当前默认入口

当前默认执行入口只包含 2 条 stream：

1. `primary`：`project-012 / sprint-001`
2. `stream-project-010-sprint-002`

其余 completed streams 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。

## 4. 约束

1. 新完成的 stream 必须在同一变更窗口从 `current-context.md` 迁出。
2. 历史索引允许保留完整路径描述，但不应重新被复制回 `current-context.md`。
3. 若未来新增消费 `current-context.md` 的脚本，应默认只读取 `## Active Streams` 与 `## Primary Stream`。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
4. `pnpm run check`
