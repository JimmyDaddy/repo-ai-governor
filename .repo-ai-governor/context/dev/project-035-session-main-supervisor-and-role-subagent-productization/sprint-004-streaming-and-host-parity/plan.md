# sprint-004-streaming-and-host-parity 计划

- Status: completed
- Date: 2026-04-02
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint Goal: 为 `session.main` supervisor runtime 补齐 streaming、embedded/sidecar/desktop host parity 与 remote-role seam 预留，并承接 closeout window 的 runtime durable storage/sqlite-fs cutover technical-solution promotion。

## 1. Task Package

1. `TK-469` map supervisor streaming events into shared session deltas and running presentation
2. `TK-470` align supervisor runtime across embedded sidecar and desktop consumer hosts
3. `TK-474` promote runtime durable storage and sqlite-fs cutover solution into formal module docs

## 2. Exit Criteria

1. 至少一条真实 answer/subagent path 能把 token/tool/lifecycle 流式事件映射为 shared `TURN_STREAM_DELTA` 语义。
2. session shell 的 running presentation 能稳定消费 supervisor streaming，不退化成 transcript 噪音。
3. embedded / sidecar / desktop consumer 至少达到 contract-level parity，且不再把 supervisor 仅限定在 embedded-only 路径。
4. future remote role / A2A bridge seam 至少在 contract 与 host 依赖层面被预留。
5. runtime durable storage/sqlite-fs cutover 方案已被正式提升为 lifecycle-managed module docs，并完成 docs-only delivery handoff 收口。

## 3. Milestones

1. 2026-03-31：创建 `sprint-004`，将 streaming 与 host parity 从 collaboration sprint 中独立拆出。
2. 2026-03-31：冻结 `TK-469 ~ TK-470`，分别承接 shared delta streaming 与 host/transport parity。
3. 2026-04-01：正式激活 `sprint-004`，将 `project-035` 的主执行面从 `sprint-005` closeout 切回 Phase C streaming/host parity implementation。
4. 2026-04-01：完成 `sprint-004`；`session.main` 已形成 shared `TURN_STREAM_DELTA` running presentation、embedded/sidecar/desktop host parity 与 `invokedRoles` remote seam 预留，见 `sprint-004-completion-summary.md`。
5. 2026-04-02：以 closeout surface 形式完成 `TK-474`；`runtime-session-durable-memory-and-sqlite-fs-cutover` 方案已正式提升为 `runtime.durable-storage` module docs，并同步 lifecycle / delivery / module-registry / manifest / triad。
