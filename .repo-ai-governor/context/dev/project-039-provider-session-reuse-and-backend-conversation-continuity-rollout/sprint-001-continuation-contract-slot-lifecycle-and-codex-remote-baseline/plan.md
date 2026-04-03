# sprint-001-continuation-contract-slot-lifecycle-and-codex-remote-baseline 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint Goal: 冻结集中 continuation contract/constants、落地 lane-scoped slot lifecycle，并交付 `Codex remote API` 的首条 provider continuation reuse baseline。

## 1. Task Package

1. `TK-508` establish centralized provider continuation constants and adapter invoke contract baseline
2. `TK-509` implement lane-scoped provider continuation slot lifecycle in shared session and orchestration runtime
3. `TK-510` roll codex remote api onto provider continuation reuse baseline

## 2. Exit Criteria

1. `adapter-sdk` continuation request/result seam 已冻结，且 `mode / status / transportKind / handleKind` 等闭集语义已集中到 constants owner seam。
2. shared session 已具备 `providerContinuations` slot state、`laneKey` derivation 与 invalidation baseline；`sessionId` 继续只作为 trace metadata 透传。
3. `Codex remote API` 已具备 `created / reused / cleared / unsupported` 的正式 reuse 闭环，且 invalid handle 后能安全回退到 stateless retry。
4. raw provider handle 尚未暴露给 CLI presenter；当前 sprint 只冻结 presenter-safe summary seed，为下个 sprint 的 consumer 投影做准备。

## 3. Milestones

1. 2026-04-04：创建 `sprint-001` planned skeleton，并冻结 `TK-508`、`TK-509`、`TK-510` 作为 continuation baseline implementation package。
2. 2026-04-04：将 `project-039 / sprint-001` 登记为 `current-context.md` 的 planned follow-up stream，同时保持 `project-038` 仍为临时 closeout primary surface。
3. 2026-04-04：同步 `technical-solution.provider-session-reuse-and-backend-conversation-continuity` delivery handoff 到 `project-039 / sprint-001`，避免 active solution 继续悬空为 `docs_only`。
4. 2026-04-04：显式激活 `project-039 / sprint-001` 并开始执行 `TK-508`；后续 `TK-509`、`TK-510` 继续在同一 sprint 内承接。
5. 2026-04-04：完成 `TK-508`、`TK-509`、`TK-510`，已交付 adapter-sdk continuation constants/request-result seam、shared-session slot lifecycle 与 Codex remote `created / reused / refreshed` baseline，并通过定向回归与 `pnpm run build`。
