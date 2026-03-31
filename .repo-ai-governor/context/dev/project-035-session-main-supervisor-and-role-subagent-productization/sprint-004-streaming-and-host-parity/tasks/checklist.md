# checklist

- [x] TK-469 map supervisor streaming events into shared session deltas and running presentation
  - 2026-03-31：任务创建，状态初始化为 `planned`；承接 supervisor/runtime 的 shared streaming delta 语义与 running dock 消费链路。
  - 2026-04-01：`TK-469` 已切换为 `active`；开始核对 `TURN_STREAM_DELTA` 发射、running presentation 消费与 transcript 分层现状。
  - 2026-04-01：已完成 `TK-469`；`session.main` answer/role-subagent path 现已写回 lifecycle/token/tool-call `TURN_STREAM_DELTA`，session shell 会在 turn 完成前展示 shared running progress。

- [x] TK-470 align supervisor runtime across embedded sidecar and desktop consumer hosts
  - 2026-03-31：任务创建，状态初始化为 `planned`；承接 sidecar/desktop parity 与 remote role seam 预留。
  - 2026-04-01：`TK-470` 已切换为 `active`；开始核对 embedded/sidecar/desktop host parity seam 与 remote role / A2A 预留契约。
  - 2026-04-01：已完成 `TK-470`；session summary 现对齐 host/transport parity，`invokedRoles` 已保留 remote bridge seam，embedded/sidecar/desktop consumer contract truth 已打通。
