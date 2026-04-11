# Runtime Governance Clients Module Overview

- Status: active
- Date: 2026-04-11
- Module ID: `runtime.governance-clients`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 `Desktop governance command center`、`VS Code editor companion` 与 `Codex / Claude Code / GitHub Copilot` 的 host-native distribution boundary 收敛到同一条本地治理客户端模块，确保多表面入口与宿主导出产物都只作为 `local orchestration service` 与 canonical workflow source 的受控 consumer，而不是各自演化出新的 runtime truth。

## 2. 职责边界

1. 定义 desktop 的 `outer-loop supervision` 产品边界：execution board、HITL inbox、artifact/review workbench、policy/standards lens、automation/review queue 与 cross-surface handoff。
2. 定义 VS Code 插件的 `inner-loop editor companion` 产品边界：当前文件/selection 的治理动作、轻量 run/review/hitl/context views、chat participant、code actions 与 editor-local handoff。
3. 为 desktop、VS Code、CLI 与 GitHub.com 这类 consumer surface 之间共享的 session / execution / HITL / artifact / handoff 标识与 presenter-safe continuity 语义定义统一 boundary。
4. 定义 host-native distribution boundary：`Codex`、`Claude Code`、`GitHub Copilot` 的 project-local assets、installable bundle、MCP bridge 与 target-aware verify 只能是 canonical workflow truth 的薄投影。
5. 正式区分 `staged export`、`host-discoverable project-local assets` 与 `installed bundle` 三种状态，避免把导出工作区误判为宿主已经可消费的资产。
6. 约束所有表面都只能消费 service-owned query/command seam，不得直接读取 `.repo-ai-governor/**` canonical truth，也不得在 surface 或 plugin 内维护第二份 orchestration state。
7. 拥有 worktree / editor / terminal / review 文档等 handoff affordance 与 host distribution apply/pack/verify 语义的正式产品边界，但不把 handoff consumer 或宿主插件升格为新的 runtime owner。
8. 定义 installer-layer `adoption pack` 与 target-repo bootstrap boundary：高层 installer 负责 pack resolve/apply/diff/upgrade/remove、managed ownership、receipt 与 bootstrap template，而底层 host export/apply/pack/verify 仍只负责 host-native projection。
9. 约束 installer 只可物化 host-consumable projection、installer metadata 与显式 repo-local bootstrap template；默认 `tool_managed` 工作区事实、`repo_local` 运行态 state 与 self-host authoring surface 不能被静态 install payload 冒充。
10. 为 multi-workspace overview、parallel execution lane、background queue、notification ownership 与 host-native rollout phase map 提供正式方向，但不宣称这些方向已在代码面全部交付。
11. 为 adopter truthfulness、real adapter invocation、secondary surface sequencing、GA evidence consolidation、standards runtime productization 与 adoption-pack installer rollout 提供 planning-side formal direction，但不把路线图判断误报为已完成交付。
12. 为 current surface baseline classification、host-native lifecycle carry slot 与 follow-up decomposition 提供 planning-side formal direction，但不把路线图判断误报为已完成交付。
13. 正式拥有 `config` / `secret` command family、session shell `/config` / `/secret` discoverability 与 `~/.repo-ai-governor/user-config.yaml` authoring UX 的 host-facing boundary；这些 surface 只能写入 user-private defaults、`credentialRef` selector 与 secret backend mutation request，不得把 raw secret value 或 user-config path 冒充为 runtime canonical truth。

## 3. 非目标

1. 不做 full IDE workbench。
2. 不让 desktop renderer、VS Code extension host 或宿主 plugin 直接拥有 runtime 主状态。
3. 不把 VS Code 插件做成大而重的 webview 套壳 app。
4. 不复制 CLI、desktop 或 service-host 的完整功能面，追求所有 surface 的 UI 或 capability 对等。
5. 不把 GitHub-only cloud console 当作当前产品主线。
6. 不把 exported host assets 当作 workflow canonical source。
7. 不再以 GitHub App Copilot Extensions 作为 GitHub Copilot 的正式分发路径。
8. 不让 `config` / `secret` command surface 默认改写共享 `governor.yaml` 或在宿主 UI 内长期维护第二份配置状态；共享治理真值仍由 canonical workspace surfaces 承担。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`
4. `architecture.governance-boundary`

## 5. Imported Contracts

1. `contract.runtime.graph-execution.v1`
2. `contract.runtime.agent-projection.v1`
3. `contract.cli.session-shell.v1`

## 6. Exported Contracts

1. `contract.runtime.governance-surface-client.v1`
2. `contract.runtime.governance-host-distribution.v1`
3. `contract.runtime.adoption-pack-install.v1`
4. `contract.runtime.governance-local-config-and-secret-command.v1`

## 7. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`desktop_surface_change`、`ide_surface_change`、`command_surface_change` 或 `runtime_contract_change` 时加载。
2. 默认只加载 overview 与 direct contract/ADR，不递归展开 desktop、IDE 或 host renderer 具体实现文件。
3. 当问题涉及 desktop / VS Code / CLI 的职责拆分、surface handoff、multi-surface continuity、service-owned client boundary、host target matrix、staged/apply/pack/verify 语义时，优先补载本模块。
4. 当问题涉及 `config` / `secret` command family、`user-config.yaml` authoring UX、session shell discoverability 或本机 secret 管理 guidance 时，也应优先补载本模块。

## 8. Cutover Notes

1. 截至 `2026-04-05`，本模块正式接受“`Desktop = outer-loop governance command center`、`VS Code = inner-loop editor companion`、`CLI = automation/scriptable entry`”的多表面分工。
2. `v1` 要求第一批优先补齐 command seam，而不是继续扩张只读 panel；其中 `submitHitlDecision`、`recoverExecution`、`getExecution`、`terminateExecution` 与 handoff contract 属于 actionable console baseline。
3. `v1` 同时接受 VS Code 插件的最小形态：`1` 个 view container、`3-4` 个轻量 views、`1` 个 chat participant、少量 language model tools、commands/code actions，以及必要时才使用的 webview。
4. 截至 `2026-04-06`，`v2` 进一步接受 host-native distribution refinement：
   - `Codex` 与 `Claude Code` 采用 `project-local assets + installable bundle` 双路径。
   - `GitHub Copilot` 采用 `repo-local assets + Copilot CLI plugin` 的 MVP target，并为 `github-com-agent` 保留 schema。
   - `staged export`、`apply/sync`、`pack`、`target-aware verify` 成为正式 contract，而不是文档层建议。
5. 本模块 formalize 的是 surface boundary、host distribution boundary 与 phased rollout，不自动宣称 host renderer、bundle packager 或 MCP bridge 已全部实现；真实 delivery follow-up 由 `project-050-governance-surface-clients-host-distribution-rollout` 承接。
6. 截至 `2026-04-06`，本模块进一步接受“adopter productization priority and surface sequencing”补充方向：当前 follow-up 固定先收口 CLI adopter truthfulness 与 GA closeout，再推进 real adapter invocation；secondary surface 固定采取 `VS Code first / desktop foundation`；GA evidence consolidation 与 standards runtime loader / pack productization 随后承接。
7. 截至 `2026-04-09`，`v3` 进一步接受 installer-layer `adoption pack` 与 target-repo bootstrap direction：
   - `host export/apply/pack/verify` 保持为 host projection substrate，而不是完整 adopter installation story。
   - 新增 installer-focused contract formalize `adopt apply/diff/upgrade/remove`、managed ownership、install receipt 与 `self-host-complete` template bootstrap boundary。
   - `self-host-complete` 只允许作为显式高级 profile，在 `workspace.mode=repo_local` 下 seed template-backed canonical surfaces；它复刻的是治理模型，不是源仓库 live-state clone。
   - 真实 rollout follow-up 由 `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout` 承接。
8. 截至 `2026-04-08`，本模块进一步接受“current surface baseline classification and follow-up decomposition”补充方向：
   - `project-052 ~ project-057` 保留为历史完成流，不再代表当前下一条 primary / planned stream。
   - 当前 follow-up order 固定重置为 `project-062 -> project-063 -> project-067 -> project-064 -> project-065 -> project-066`。
   - adopter-facing distribution truth lane 由 `project-063 + project-067` 共同承接。
   - `project-068` 专门承接 `local-model` 与 `github-com-agent` 的 `P2 deferred` follow-up。
9. 截至 `2026-04-11`，`v4` 进一步接受 local user config / secret-backed command configuration direction：
   - `config` 成为用户级私有默认值的正式 command family，canonical path 固定为 `~/.repo-ai-governor/user-config.yaml`。
   - `secret` 成为本机 secret backend mutation surface，真实 secret 只允许进入 OS keychain / helper 或显式 opt-in 的 unsafe fallback backend。
   - session shell `/config`、`/secret` 只承担 discoverability 与 handoff affordance，不形成新的 runtime truth。
   - `runtime.governance-clients` 负责 authoring UX 与 host-facing copy，`runtime.agent-projection` 继续负责 canonical normalization 与 read-only consumption。

## 9. Detail Docs

1. Contract:
   - `contracts/governance-surface-client-contract.md`
   - `contracts/local-user-config-and-secret-command-contract.md`
   - `contracts/governance-host-distribution-contract.md`
   - `contracts/governance-adoption-pack-install-contract.md`
2. ADR:
   - `adrs/desktop-command-center-and-vscode-editor-companion-split.md`
   - `adrs/host-native-distribution-and-target-specific-consumption.md`
   - `adrs/adopter-productization-priority-and-surface-sequencing.md`
   - `adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
   - `adrs/current-surface-baseline-classification-and-followup-decomposition.md`
