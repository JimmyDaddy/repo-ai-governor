# TK-470 align supervisor runtime across embedded sidecar and desktop consumer hosts

- Status: completed
- Date: 2026-04-01
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-004-streaming-and-host-parity`

## 1. 任务目标

让 `session.main` supervisor runtime 不再长期停留在 embedded-only 形态，逐步对齐 sidecar host 与 desktop consumer 的 shared contract，并为 remote role / A2A bridge 预留 seam。

## 2. Depends On

1. `TK-469`

## 3. 预期产物

1. supervisor runtime 的 host/transport-neutral seam
2. embedded / sidecar / desktop consumer parity baseline
3. remote role / A2A bridge seam 的 contract-level 预留
4. host parity 相关 regression / documentation evidence

## 4. 验证

1. `pnpm run build`
2. host parity 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；目标是避免 `session.main supervisor` 最终被固化成 CLI embedded-only 特例。
2. 2026-04-01：任务激活；开始核对 orchestration host seam、embedded/sidecar/desktop consumer parity 现状，以及 remote role / A2A bridge contract-level 预留缺口。
3. 2026-04-01：任务完成；session summary 已对齐 `serviceHostKind/serviceTransportKind` host truth，`invokedRoles` 已为 remote role / A2A bridge 预留 dispatch/transport seam，embedded/sidecar/desktop consumer contract parity 已完成基线收口。
