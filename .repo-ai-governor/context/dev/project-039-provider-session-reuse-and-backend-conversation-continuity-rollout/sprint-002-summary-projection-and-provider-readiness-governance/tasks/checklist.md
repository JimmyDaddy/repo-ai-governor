# checklist

- [x] TK-511 project presenter-safe continuation summaries into session.main transcript and resume consumers
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 continuation summary 的 turn-level projection、CLI transcript affordance 与 resume consumer 边界。
  - 2026-04-04：任务完成：`TURN_COMPLETED` payload、CLI transcript store 与 transcript pane 已接通 presenter-safe continuation block；raw handle 继续留在 runtime/service seam，并通过定向回归与 `pnpm run build`。
  - 2026-04-04：CR 修复追加收口：补齐 fresh stateless path 下的 `unsupported` continuation summary 投影、CLI transcript 渲染与双语 i18n key，并通过定向回归与 `pnpm run build`。

- [x] TK-512 add continuation invalidation stateless-retry and resume fallback regression coverage
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 invalidation、single stateless retry、surface fallback 与 resume parity 的回归矩阵。
  - 2026-04-04：任务完成：已补齐 Codex remote `created -> reused -> refreshed`、session.main continuation request/summary、transcript summary block、shared-session persistence 与 resumed-turn reload 回归，并通过定向测试与 `pnpm run build`。
  - 2026-04-04：CR 修复追加收口：新增 `SharedSessionManager.updateContextWithLatest()` 锁内 latest-context merge 回归，确认 sibling continuation slot 不会被旧 context 快照覆盖，并通过定向回归与 `pnpm run build`。

- [x] TK-513 probe codex cli continuation readiness and freeze provider adoption guardrails
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `Codex CLI` contract readiness 探测，以及 `Claude / GitHub Copilot` adoption gate 的显式冻结。
  - 2026-04-04：任务完成：Codex CLI、Claude CLI / remote API 与 GitHub Copilot CLI 在 continuation 请求下均已 truthfully 返回 `unsupported`；当前 provider adoption guardrail 已冻结为“仅 Codex remote 正式复用，其余 path 保持 unsupported”，并通过 smoke/regression 回归与 `pnpm run build`。
