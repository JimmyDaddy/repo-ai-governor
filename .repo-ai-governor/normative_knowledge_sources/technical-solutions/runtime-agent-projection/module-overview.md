# Runtime Agent Projection Module Overview

- Status: active
- Date: 2026-03-30
- Module ID: `runtime.agent-projection`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把多工具 onboarding 与 role-agent projection 收敛为一条可治理的 runtime seam，使 `connect / doctor / verify` 可以稳定产出 adapter 与 role binding 结果，并把 `roleProfileId / routeKey / executionContext` 投影为可回放的 `AgentDescriptor`。

## 2. 职责边界

1. 统一 `connect / doctor / verify` 的 onboarding contract、诊断语义和最小支持矩阵。
2. 将 `connect` 默认保持为 analyze-first candidate 生成面，并通过显式 `diff/apply` follow-up surface 承接 reviewable write-back。
3. 将 role、surface、session、capability、budget 与 timeout 组合成 agent descriptor 视图。
4. 为 CLI、report、diagnostics 与后续 UI 提供同一份 agent projection 数据与 presenter-safe / panel-safe view model；phase-2 formal UI consumer baseline 通过 transport-neutral `AgentProjectionPanelViewModel` seam 落地。
5. 将 `AgentSessionRegistry` 作为共享 session 的投影层，而不是新的会话事实源。
6. 允许 LangGraph supervisor 消费 agent descriptor，但不把 supervisor 升格为新的 canonical runtime。

## 3. 非目标

1. 不替代 `runtime.orchestration` 的 graph execution contract。
2. 不把 projection 层做成第二套执行 runtime。
3. 不允许 UI 视图或 presenter 反向成为 agent 事实源。
4. 不直接承载 provider 登录、远端发布或仓库级 CI 运维脚本。
5. 不允许 `connect` 默认静默改写活动 `governor.yaml`。

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

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`adapter_change`、`cli_ui_change`、`command_surface_change`、`technical_solution_module_change` 时加载。
2. 默认只加载 overview 与 direct contracts，不递归展开 onboarding 命令实现或 projection presenter。
3. 当问题涉及 `connect / doctor / verify`、agent descriptor、session projection 或 LangGraph multi-agent 消费时，优先补载本模块 contract。
4. 当问题涉及 candidate config apply、diff/merge explain、agent projection presenter、`AgentProjectionPanelViewModel` seam 或 desktop-ready projection consumer 时，也应优先补载本模块。

## 8. Detail Docs

1. Contract:
   - `contracts/agent-onboarding-contract.md`
   - `contracts/agent-projection-contract.md`
2. ADR:
   - `adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`
   - `adrs/connect-apply-and-projection-consumer-productization.md`
