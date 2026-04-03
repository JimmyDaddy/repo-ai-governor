# sprint-001-shared-liveness-contract-and-codex-watchdog-baseline 计划

- Status: completed
- Date: 2026-04-03
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint Goal: 为 invoke lifecycle 建立 shared liveness runtime/telemetry 基线，并完成首批 formal-solution / delivery governance 收口；剩余 `Codex`-specific watchdog cutover 迁移到 `sprint-003`。

## 1. Task Package

1. `TK-486` implement shared invoke liveness runtime telemetry and watchdog baseline
2. `TK-492` prepare api-key remote adapter invocation technical solution promotion readiness and follow-up mapping
3. `TK-493` align active invoke liveness formal solution with amended orchestration projection and diagnostics boundaries
4. `TK-494` promote session-main capability explainer and contextual guidance draft into active interactive-cli formal docs
5. `TK-500` promote api-key remote adapter invocation draft into active runtime-agent-projection formal docs

## 2. Exit Criteria

1. shared invoke-liveness runtime 已在 `adapter-sdk` 与 rollout runtime 中形成可复用状态机、timeout budget、reason code 与 telemetry hook baseline。
2. invoke-liveness formal docs、orchestration projection 边界与 remote-api transport/provider-binding seam 已完成正式治理收口。
3. `still running` presenter-local 心跳已与真实 transport / semantic 续命信号解耦，且 `session.main / execution details` 已有可消费 invoke-liveness 快照的 downstream integration seam。
4. 剩余未完成的 `Codex`-specific graceful interrupt / hard terminate follow-through 已显式迁移到 `sprint-003`，不再阻塞本 sprint 收口。

## 3. Milestones

1. 2026-04-02：创建 `sprint-001` 并冻结 `TK-486`、`TK-487`，作为 `project-037` 的首个 active planning surface。
2. 2026-04-02：登记 planned `sprint-002` 与 `sprint-003`，确保 cross-adapter rollout 与 diagnostics/governance closeout 已有后续承接面。
3. 2026-04-02：补充 `TK-492`，为 `api-key remote adapter invocation` draft 建立 promotion-readiness review 与 lifecycle 锚点，作为后续 `sprint-002` formalization / rollout 输入。
4. 2026-04-02：补充 `TK-494`，将 `session-main capability explainer + contextual command guidance` draft 以 amendment 方式并入 active interactive-cli formal solution，并把 promotion 证据写回 project-037 当前 sprint ledger。
5. 2026-04-02：补充 `TK-500`，将 `api-key remote adapter invocation` draft 正式提升为 active `runtime.agent-projection` solution，并同步 lifecycle/delivery/module/manifest/review/handoff evidence。
6. 2026-04-03：完成 sprint-001 台账纠偏：`TK-486` 作为 shared baseline 吸收交付项回填为 `completed`，`TK-487` 迁移到 `sprint-003` 继续承接残余 Codex-specific watchdog / graceful interrupt closeout，因此本 sprint 状态切换为 `completed`。
