# checklist

- [x] TK-405 orchestration-service-client session DTO and service-owned contract baseline
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：`sprint-002` 已激活，任务切换到 `active` 并开始实现 service-backed session DTO 与 ownership contract。
  - 2026-03-30：实现完成，已补齐 `appendSessionMessage` DTO/export surface，并固定 canonical session state 由 local orchestration service 托管。
- [x] TK-406 sidecar host session runtime and session.main route dispatch
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：`sprint-002` 已激活，任务切换到 `active` 并开始实现 sidecar session runtime 与 `session.main` dispatch。
  - 2026-03-30：实现完成，已收口 sidecar/session runtime dispatch，并修复 sidecar TS loader 工作区包映射缺口，恢复 desktop/sidecar smoke 稳定性。
- [x] TK-407 CLI session client transcript store and resume entrypoints
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：`sprint-002` 已激活，任务切换到 `active` 并开始实现 transcript store、会话内 `/resume` 与顶层 `resume`。
  - 2026-03-30：实现完成，已收口 service-backed transcript store、top-level `resume [session-id]`、会话内 `/resume [session-id]` 与启动阶段的 resume fallback。
- [x] TK-408 multi-turn recovery cancellation and desktop-ready streaming parity
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：`sprint-002` 已激活，任务切换到 `active` 并开始补齐恢复、取消与 streaming parity。
  - 2026-03-30：实现完成，已补齐 multi-turn recovery、recoverable cancellation hints、stream delta parity 与 desktop-ready 验证覆盖。
