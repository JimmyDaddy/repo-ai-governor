# DA-129 review 子链受控内联与状态抽象收口

- Status: active
- Date: 2026-03-24
- Source Task: `TK-131`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-002-ledger-review-gate-and-memory-follow-up`

## 1. 交付摘要

本轮没有把 `review` 子链硬塞回 `run` 主链内部，而是先完成了等价的高层状态抽象与 task-aware managed chain，降低了执行者处理 queued artifact 的负担。

## 2. 关键变化

1. `review` request artifact 现在携带 `taskId`、`recordLedger` 与 `reviewChainMode`，不再只是匿名队列工件。
2. `review-verify` 新增 `pending/applied/failed` 三态 ledger backfill 表达，并把 `taskId` 回写进 verify/backfill/request 三类工件。
3. 当执行者显式使用 `--record-ledger --task-id <TK-xxx>` 时，`review-verify` 会自动调用 ledger sync 机制关闭子链，而不是停留在“等待人工消费”的 pending 状态。
4. CLI experience 输出中的 ledger-backfill 阶段会按 managed chain 结果切换为 `WAITING` 或 `COMPLETED`，对外暴露高层状态而非裸队列语义。

## 3. 证据路径

1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/commands/review-verify-command.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `scripts/governance/sync-task-ledger.js`

## 4. 结论

分析稿 `6.5 / P1` 中“review 子链不再只暴露串命令和工件队列”的缺口已完成第一轮实装收口，并为 `TK-100` 后续真正的 `run` 内联保留了兼容入口。
