# Runtime Agent Projection Module Overview

- Status: active
- Date: 2026-04-04
- Module ID: `runtime.agent-projection`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把多工具 onboarding、role-agent projection、transport/provider truth 与 adapter-facing invoke seam 收敛为一条可治理的 runtime boundary，使 `connect / doctor / verify` 可以稳定产出 adapter 与 role binding 结果，并把 `roleProfileId / routeKey / executionContext` 投影为可回放的 `AgentDescriptor`。

## 2. 职责边界

1. 统一 `connect / doctor / verify` 的 onboarding contract、分层 adapter health check / route probe 语义，以及 `surface -> transport -> provider binding` 的最小支持矩阵。
2. 将 `connect` 默认保持为 analyze-first candidate 生成面，并通过显式 `diff/apply` follow-up surface 承接 reviewable write-back。
3. 将 role、surface、session、transport、provider binding、capability、budget、timeout 与 invoke-liveness 预算组合成 agent descriptor 视图。
4. 将 install / auth / protocol / semantic / route-capability 五层 probe 结果归一化为 presenter-safe 的 health-check 事实，并稳定带出 transport / provider / model / binding truth，供 CLI、report、diagnostics 与路由 fallback 共用。
5. 将 agent invoke 生命周期统一建模为 process liveness、transport activity、semantic progress、graceful interrupt 与 hard-timeout fuse，使长 review / verifier / tester 任务不再只靠固定 wall-clock timeout 决定是否中断；当 transport 为 `remote_api` 时，同样要求覆盖 HTTP chunk / SSE / structured stream 活动。
6. 正式拥有 adapter-facing provider continuation seam，包括 `AgentStageContinuationRequest/Result`、non-secret continuation handle 边界、transport/provider-compatible reuse truth，以及 unsupported/invalid 时的 stateless fallback 语义。
7. 为 CLI、report、diagnostics 与后续 UI 提供同一份 agent projection 数据与 presenter-safe / panel-safe view model；phase-2 formal UI consumer baseline 通过 transport-neutral `AgentProjectionPanelViewModel` seam 落地。
8. 将 `AgentSessionRegistry` 作为共享 session 的投影层，而不是新的会话事实源。
9. 允许 LangGraph supervisor 消费 agent descriptor，但不把 supervisor 升格为新的 canonical runtime。
10. 在 secret store 与 provider-owned config 上保持 analyze-first / read-only 边界；`connect / doctor / verify` 与 continuation seam 都只能生成 candidate、diagnostics、`next_action` 或非敏感 provider reference，不得静默写入 keychain、provider 配置或持久化 bearer-like continuation token。

## 3. 非目标

1. 不替代 `runtime.orchestration` 的 graph execution contract。
2. 不把 projection 层做成第二套执行 runtime。
3. 不允许 UI 视图或 presenter 反向成为 agent 事实源。
4. 不直接承载 provider 登录、远端发布或仓库级 CI 运维脚本。
5. 不允许 `connect` 默认静默改写活动 `governor.yaml`。
6. 不把 `GitHub Copilot`、`GitHub Models` 与 `Copilot SDK` 强行压平成单一“GitHub 远程等价物”；若需要 key-based remote inference，必须显式区分 surface 与 binding。
7. 不拥有 laneKey、session slot lifecycle、turn-level continuation summary 或 shared-session truth；这些边界仍属于 `runtime.orchestration`。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`

## 5. Imported Contracts

1. `contract.runtime.graph-execution.v1`
2. `contract.cli.interactive-shell.v1`

## 6. Exported Contracts

1. `contract.runtime.agent-onboarding.v1`
2. `contract.runtime.agent-projection.v1`
3. `contract.runtime.adapter-health-check.v1`
4. `contract.runtime.agent-invoke-liveness.v1`

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`adapter_change`、`cli_ui_change`、`command_surface_change`、`technical_solution_module_change` 时加载。
2. 默认只加载 overview 与 direct contracts，不递归展开 onboarding 命令实现或 projection presenter。
3. 当问题涉及 `connect / doctor / verify`、agent descriptor、session projection、adapter health check / route probe 或 LangGraph multi-agent 消费时，优先补载本模块 contract。
4. 当问题涉及 `remote_api`、provider binding、transport-aware diagnostics、credential discovery 边界或 `surface -> transport -> binding` 组合投影时，也应优先补载本模块。
5. 当问题涉及 invoke timeout、长任务 stall 判定、graceful interrupt、partial output preservation 或 watchdog / liveness telemetry 时，也应优先补载本模块。
6. 当问题涉及 candidate config apply、diff/merge explain、agent projection presenter、`AgentProjectionPanelViewModel` seam 或 desktop-ready projection consumer 时，也应优先补载本模块。
7. 当问题涉及 provider session reuse、backend conversation continuity、continuation handle compatibility、transport-aware reuse 或 adapter-facing continuation request/result seam 时，也应优先补载本模块。

## 8. Detail Docs

1. Contract:
   - `contracts/agent-onboarding-contract.md`
   - `contracts/agent-projection-contract.md`
   - `contracts/adapter-health-and-route-probe-contract.md`
   - `contracts/agent-invoke-liveness-contract.md`
2. ADR:
   - `adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`
   - `adrs/connect-apply-and-projection-consumer-productization.md`
   - `adrs/layered-adapter-health-check-and-route-capability-probe.md`
   - `adrs/agent-invoke-liveness-and-timeout-governance.md`
   - `adrs/remote-api-transport-and-provider-binding-seam.md`
   - `adrs/provider-session-reuse-and-continuation-handle-seam.md`
