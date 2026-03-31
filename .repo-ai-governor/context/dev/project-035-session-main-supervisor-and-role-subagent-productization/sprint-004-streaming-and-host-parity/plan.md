# sprint-004-streaming-and-host-parity 计划

- Status: planned
- Date: 2026-03-31
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint Goal: 为 `session.main` supervisor runtime 补齐 streaming、embedded/sidecar/desktop host parity 与 remote-role seam 预留。

## 1. Task Package

1. `TK-469` map supervisor streaming events into shared session deltas and running presentation
2. `TK-470` align supervisor runtime across embedded sidecar and desktop consumer hosts

## 2. Exit Criteria

1. 至少一条真实 answer/subagent path 能把 token/tool/lifecycle 流式事件映射为 shared `TURN_STREAM_DELTA` 语义。
2. session shell 的 running presentation 能稳定消费 supervisor streaming，不退化成 transcript 噪音。
3. embedded / sidecar / desktop consumer 至少达到 contract-level parity，且不再把 supervisor 仅限定在 embedded-only 路径。
4. future remote role / A2A bridge seam 至少在 contract 与 host 依赖层面被预留。

## 3. Milestones

1. 2026-03-31：创建 `sprint-004`，将 streaming 与 host parity 从 collaboration sprint 中独立拆出。
2. 2026-03-31：冻结 `TK-469 ~ TK-470`，分别承接 shared delta streaming 与 host/transport parity。
