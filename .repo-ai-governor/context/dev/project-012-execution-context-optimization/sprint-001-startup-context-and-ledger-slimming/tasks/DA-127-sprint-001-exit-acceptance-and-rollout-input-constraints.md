# DA-127 sprint-001 出口验收与 rollout 输入约束

- Status: active
- Date: 2026-03-24
- Source Task: `TK-129`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 验收结论

`project-012 / sprint-001` 的第一轮上下文瘦身目标已达到 `completed`，可以作为后续工作流与活跃项目的正式输入基线继续消费。

## 2. 验收范围

1. 启动基线与 manifest 分层语义是否对齐。
2. `current-context` 是否已收敛为 active-only 默认入口，并建立 completed history 分层。
3. `TK/checklist/tasks.csv` 与任务模板输入边界是否收敛。
4. 相关治理脚本、CLI runtime 与整仓门禁是否可复跑。

## 3. 验收结果

1. 启动基线
   - `AGENTS.md` 与 `long-term-maintenance-guide.md` 已对齐为 manifest 驱动的 `L0 默认加载 + L1 按需补载`。
   - 结论产物：`DA-124`。
2. active/history 分层
   - `current-context.md` 默认入口仅保留 primary 与 active parallel streams。
   - completed streams 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。
   - `check-task-ledger-sync.js` 现会阻断 `Active Streams` 中的非 active 条目。
   - 结论产物：`DA-125`。
3. task-ledger 与模板输入收口
   - `TK` canonical source、`checklist/tasks.csv` 的派生职责边界已写实。
   - 新任务模板默认改为 `Required Inputs + Traceback References`。
   - CLI task-driven runtime 已兼容新旧两种任务卡结构。
   - 结论产物：`DA-126`。
4. sprint 级收尾
   - `TK-126`~`TK-129` 共 `4` 个任务，最新执行记录聚合为 `4/4 completed`。
   - sprint-001 状态已切换为 `completed`。

## 4. rollout 输入约束

1. 后续活跃项目默认启动只消费：
   - `current-context.md`
   - `product-requirements-brief.md`
   - `code_standards.md`
   - `long-term-maintenance-guide.md`
   - manifest 所要求的其他 `L0 + default_load=true`
2. 执行入口只允许从 `current-context.md -> Primary Stream + Active Streams` 取默认 stream；已完成 stream 必须从 history 文件追溯，不得重新塞回默认入口。
3. 新任务卡默认使用 `Required Inputs + Traceback References`，`Required Inputs` 建议控制在 `3-5` 条。
4. `review` 子链、gate 分层与 runtime memory selective injection 仍是后续 follow-up 议题，不应在当前主执行流中顺带扩大范围。
5. 对 `project-010` 的直接 handoff：
   - 继续以 `project-011` 的 CLI decomposition handoff 为工程边界输入。
   - 同时遵循 `project-012` 已冻结的启动基线、active stream、任务卡输入分层约束。

## 5. 建议的后续跟进主题

1. review 子链从手动串联转为受控内联子链。
2. gate 分层显式进入任务模板，区分开发验证与交付验证。
3. runtime memory/context 注入从全量快照转为选择性装配。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
4. `pnpm run check`
