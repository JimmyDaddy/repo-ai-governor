# checklist

- [x] TK-508 establish centralized provider continuation constants and adapter invoke contract baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 continuation constants、adapter invoke/stream contract 与 `sessionId` trace-only boundary 的正式冻结。
  - 2026-04-04：状态切换为 `active`；`project-039 / sprint-001` 已升级为当前 primary stream，开始实现 continuation constants、request/result contract 与 trace-only `sessionId` boundary。
  - 2026-04-04：任务完成：`adapter-sdk` 已补齐集中 `mode / status / transportKind / handleKind` 常量、`ProviderContinuationHandle` 与 invoke/stream additive continuation seam，并通过 continuation 定向回归与 `pnpm run build`。

- [x] TK-509 implement lane-scoped provider continuation slot lifecycle in shared session and orchestration runtime
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `providerContinuations` slot state、`laneKey` derivation、slot-aware mutation 与 invalidation baseline。
  - 2026-04-04：任务完成：shared-session context 已正式持有 lane-scoped continuation slots；`session.main` / orchestration runtime 已接通 slot read-write、summary projection、resume reload 与 pre-dispatch invalidation 基线，并通过定向回归与 `pnpm run build`。

- [x] TK-510 roll codex remote api onto provider continuation reuse baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `Codex remote API` continuation request/result 闭环、slot persistence 连接与 invalid-handle fallback baseline。
  - 2026-04-04：任务完成：Codex remote path 已接入 `previous_response_id`、`created / reused / refreshed` continuation result、invalid-handle single stateless retry 与 slot mutation 闭环，并通过 smoke/regression 回归与 `pnpm run build`。
