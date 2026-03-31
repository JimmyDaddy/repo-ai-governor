# TK-469 map supervisor streaming events into shared session deltas and running presentation

- Status: completed
- Date: 2026-04-01
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-004-streaming-and-host-parity`

## 1. 任务目标

将 `session.main` supervisor 与 role-subagent 的 streaming 事件映射进 shared `TURN_STREAM_DELTA` 语义，并让 running presentation 稳定消费这些流式更新。

## 2. Depends On

1. `TK-468`

## 3. 预期产物

1. token/tool/lifecycle -> `TURN_STREAM_DELTA` 映射
2. running presentation 对 supervisor streaming 的稳定消费路径
3. streaming answer / subagent regression coverage
4. transcript 与 running dock 的动态分层验证

## 4. 验证

1. `pnpm run build`
2. streaming 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；streaming 优先围绕 shared session delta contract 收口，不先发明第二套前台私有协议。
2. 2026-04-01：任务激活；开始核对 supervisor answer/subagent path 的 `TURN_STREAM_DELTA` 发射链路、running presentation 消费链路与 transcript 分层缺口。
3. 2026-04-01：任务完成；`session.main` answer/role-subagent path 现已将 lifecycle/token/tool-call 映射进 shared `TURN_STREAM_DELTA`，session shell 的 running dock 可在 turn 未完成前稳定消费这些流式更新。
