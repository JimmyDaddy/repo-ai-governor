# Runtime Governance Clients Module Overview

- Status: active
- Date: 2026-04-20
- Module ID: `runtime.governance-clients`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 `Desktop governance command center`、`VS Code editor companion` 与 `Codex / Claude Code / GitHub Copilot` 的 host-native distribution boundary 收敛到同一条本地治理客户端模块，确保多表面入口与宿主导出产物都只作为 `local orchestration service` 与 canonical workflow source 的受控 consumer，而不是各自演化出新的 runtime truth。

## 2. 职责边界

1. 定义 VS Code 的 `primary governance workbench` 产品边界：`Overview / Tasks / Queue / Sessions / HITL / Reviews / Workflow / Adoption` 这些 workbench surface 只能作为 shared local orchestration service 的受控 consumer，而不是 editor 内的 shadow runtime。
2. 定义 desktop 的 `foundation-only secondary surface` / `coexisting secondary surface` 边界：desktop 可以继续承接 queue、artifact、HITL 与 optional shell 候选职责，但 primary workbench claim 与进一步 de-scope 仍必须走独立 decision surface 与真实 evidence。
3. 为 desktop、VS Code、CLI 与 GitHub.com 这类 consumer surface 之间共享的 session / execution / HITL / artifact / handoff 标识与 presenter-safe continuity 语义定义统一 boundary。
4. 定义 host-native distribution boundary：`Codex`、`Claude Code`、`GitHub Copilot` 的 project-local assets、installable bundle、MCP bridge 与 target-aware verify 只能是 canonical workflow truth 的薄投影。
5. 正式区分 `staged export`、`host-discoverable project-local assets` 与 `installed bundle` 三种状态，避免把导出工作区误判为宿主已经可消费的资产。
6. 约束所有表面都只能消费 service-owned query/command seam，不得直接读取 `.repo-ai-governor/**` canonical truth，也不得在 surface 或 plugin 内维护第二份 orchestration state。
7. 拥有 worktree / editor / terminal / review 文档等 handoff affordance 与 host distribution apply/pack/verify 语义的正式产品边界，但不把 handoff consumer 或宿主插件升格为新的 runtime owner。
8. 定义 installer-layer `adoption pack` 与 target-repo bootstrap boundary：高层 installer 负责 pack resolve/apply/diff/upgrade/remove、managed ownership、receipt 与 bootstrap template，而底层 host export/apply/pack/verify 仍只负责 host-native projection。
9. 约束 installer 只可物化 host-consumable projection、installer metadata 与显式 repo-local bootstrap template；默认 `tool_managed` 工作区事实、`repo_local` 运行态 state 与 self-host authoring surface 不能被静态 install payload 冒充。
10. 正式拥有 built-in adoption pack parity 与 self-host readiness sync boundary：需要同步的 installer/template surface、template-seed surface 与 adopter-owned placeholder surface 必须显式分层；`current-context` / `normative-loading-manifest` 这类同一路径结构与实例值分离的 surface 不得回退成整文件镜像。
11. 正式要求 repo-specific governance / product / execution starter docs 的 placeholder readiness interlock 只属于 self-host authoring / execution path；默认 `adopter-complete` 安装路径不得因缺少 repo-local authoring docs 而被误阻断。
12. 正式拥有 VS Code hybrid workbench model 的 surface 选择规则：`TreeView / Commands / Chat / Code Actions` 优先承接 quick action 与 editor-local handoff；只有 task board、review workbench、automation queue、workflow studio、adoption / host operations 这类多对象 surface 才允许进入 `workbench panel`。
13. 正式要求 `VS Code primary workbench` 的 public support truth 延后于真实 phase evidence：formal direction 可以先进入 module docs，但 `support-matrix / README / adoption playbook / desktop README` 只有在对应 phase evidence 落地后才允许改口。
14. 为 multi-workspace overview、parallel execution lane、background queue、notification ownership 与 host-native rollout phase map 提供正式方向，但不宣称这些方向已在代码面全部交付。
15. 为 adopter truthfulness、real adapter invocation、secondary surface sequencing、GA evidence consolidation、standards runtime productization 与 adoption-pack installer rollout 提供 planning-side formal direction，但不把路线图判断误报为已完成交付。
16. 为 current surface baseline classification、host-native lifecycle carry slot 与 follow-up decomposition 提供 planning-side formal direction，但不把路线图判断误报为已完成交付。
17. 正式拥有 `config` / `secret` command family、session shell `/config` / `/secret` discoverability 与 `~/.repo-ai-governor/user-config.yaml` authoring UX 的 host-facing boundary；这些 surface 只能写入 user-private defaults、`credentialRef` selector 与 secret backend mutation request，不得把 raw secret value 或 user-config path 冒充为 runtime canonical truth。
18. 对显式 `/secret set <keyName>` 的 session-shell authoring path，正式要求 host-facing surface 在 slash secure route 命中后切换到本地隐藏输入与 redacted mutation handoff；raw secret 不得经由 slash text、argv、preview recap、error copy 或 transcript surface 暴露，而 skill-triggered secure-input request 与 desktop / VS Code prompt parity 继续留待后续独立 solution。
19. 正式拥有 adopter installer quickstart convenience boundary：`adopt bootstrap` 只可 orchestrate `init -> doctor --fix -> adopt apply -> adopt verify`；`check` 继续作为显式 broader governance audit follow-up；缺省 selector 只允许落官方 built-in pack，而 existing receipt drift / mismatch rerun 必须回到 `adopt diff/upgrade/remove` lifecycle。
20. 正式拥有 host-native provider onboarding boundary：VS Code 与后续 host surface 可以通过显式 provider-onboarding mutation seam 采集 `provider / model / endpoint / API key`，但 raw key 只能进入 Governor managed secret backend，配置层只允许持久化 `credentialRef` 与非敏感 provider defaults；`connect / doctor / verify` 继续保持 analyze-first / read-only onboarding truth。

## 3. 非目标

1. 不让 desktop renderer、VS Code extension host 或宿主 plugin 直接拥有 runtime 主状态。
2. 不把 VS Code workbench 退化成“大而重的 webview 套壳 app + shadow state”。
3. 不复制 CLI、desktop 或 service-host 的全部实现，只 formalize truth boundary、workbench ownership 与 phased cutover。
4. 不把 GitHub-only cloud console 当作当前产品主线。
5. 不把 exported host assets 当作 workflow canonical source。
6. 不再以 GitHub App Copilot Extensions 作为 GitHub Copilot 的正式分发路径。
7. 不让 `config` / `secret` command surface 默认改写共享 `governor.yaml` 或在宿主 UI 内长期维护第二份配置状态；共享治理真值仍由 canonical workspace surfaces 承担。
8. 不把 VS Code `SecretStorage`、`settings.json` 或 extension-local cache 升格为 canonical secret owner，也不允许 direct API key entry 借机绕开 managed secret backend。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`
4. `architecture.governance-boundary`

## 5. Imported Contracts

1. `contract.runtime.graph-execution.v1`
2. `contract.runtime.agent-projection.v1`
3. `contract.cli.session-shell.v1`
4. `contract.runtime.governance-workbench-aggregation-facade.v1`

## 6. Exported Contracts

1. `contract.runtime.governance-surface-client.v1`
2. `contract.runtime.governance-host-distribution.v1`
3. `contract.runtime.adoption-pack-install.v1`
4. `contract.runtime.governance-local-config-and-secret-command.v1`
5. `contract.runtime.vscode-governance-workbench-surface.v1`
6. `contract.runtime.governance-provider-onboarding.v1`

## 7. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`desktop_surface_change`、`ide_surface_change`、`command_surface_change` 或 `runtime_contract_change` 时加载。
2. 默认只加载 overview 与 direct contract/ADR，不递归展开 desktop、IDE 或 host renderer 具体实现文件。
3. 当问题涉及 desktop / VS Code / CLI 的职责拆分、surface handoff、multi-surface continuity、service-owned client boundary、host target matrix、staged/apply/pack/verify 语义时，优先补载本模块。
4. 当问题涉及 `config` / `secret` command family、`user-config.yaml` authoring UX、session shell discoverability、本机 secret 管理 guidance，或 VS Code direct API key provider onboarding 时，也应优先补载本模块。

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
10. 截至 `2026-04-12`，本模块进一步接受“session-shell secure local secret authoring”补充方向：显式 `/secret set <keyName>` 允许由 session shell 直接切换到本地隐藏输入，但当前 formal scope 仅锁定 command-initiated secure capture、redacted mutation handoff 与 suffix pre-commit rejection；service-owned secure-input request、desktop secure dialog 与 VS Code secure prompt 仍不属于本轮 active truth。
11. 截至 `2026-04-15`，本模块进一步接受 built-in adoption pack parity 与 self-host readiness sync direction：
   - built-in pack 必须显式区分 `exact_sync`、`generated_projection`、`template_seed` 与 `adopter_owned_placeholder` surface。
   - repo-specific governance / product / execution starter docs 在 `self-host-complete` 下继续属于 adopter-owned placeholder，而不是源仓库 mirror。
   - self-host placeholder readiness interlock 只属于 `self-host-complete + repo_local` 或等价 detected surface；默认 `adopter-complete` 路径继续排除在外。
   - 真实 parity/readiness rollout follow-up 由 `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout` 承接。
12. 截至 `2026-04-15`，本模块进一步接受 adopter quickstart bootstrap command direction：
   - public installer convenience surface 固定为 `adopt bootstrap`，而不是新增顶层 installer family。
   - `adopt bootstrap` 只编排 install-affecting stages；`check` 继续保留为显式 broader governance audit follow-up。
   - omitted selector 只允许落官方 built-in pack；显式 selector 复用当前 `adopt apply` resolver，歧义时继续 fail-closed。
   - clean existing installation 可以通过 convenience rerun 复用；managed drift、pack mismatch 或 profile mismatch 必须回到 `adopt diff/upgrade/remove`，而不是隐式升级成新的 lifecycle owner。
   - 真实 command/runtime/docs rollout follow-up 由 `project-108-adopter-quickstart-bootstrap-rollout` 承接。
13. 截至 `2026-04-16`，本模块进一步接受“VS Code primary full governance workbench”补充方向：
   - planning-side formal direction 现以 `VS Code primary workbench / CLI automation-headless substrate / desktop foundation-only secondary surface` 为默认分工，而不再把 `inner-loop editor companion` 当作 VS Code 的终局边界。
   - `TreeView / Commands / Chat / Code Actions` 仍是默认入口；task board、review workbench、workflow studio、automation queue 与 adoption / host operations 允许进入 workbench panel，但只能消费 service-owned DTO / query / command seam。
   - `support-matrix / README / adoption playbook / desktop README` 仍然必须 evidence-gated；在 `Phase A / Phase B` 期间，public support truth 只允许保持 `companion-upgraded / workbench baseline in progress`，不得提前宣称 full workbench cutover 已完成。
   - companion-era split ADR 保留为历史基线；新的 primary workbench 方向与 temporary bridge exit criteria 由新增 ADR/contract 承接，不顺手废弃 host distribution / installer active truth。
14. 截至 `2026-04-20`，本模块进一步接受“VS Code plugin direct API key and secret-backed provider onboarding”补充方向：
   - 插件 primary human path 改为 direct API key entry，而不是继续把 `credentialEnvVar` 作为默认 onboarding authoring surface。
   - host-facing direct entry 必须落到显式 provider-onboarding mutation seam；`connect / doctor / verify` 继续保持 analyze-first / read-only truth。
   - canonical owner split 固定为 `runtime.governance-clients` 负责 host-facing UX / CTA mapping，`runtime.agent-projection` 继续负责 `transport / provider / vendorBinding / next_action(s)` truth。
   - direct onboarding 允许持久化的 canonical config target 以 `tools.<tool>.transport`、`tools.<tool>.remoteApi.provider`、`tools.<tool>.remoteApi.vendorBinding`、`tools.<tool>.remoteApi.model`、`tools.<tool>.remoteApi.endpoint`、`tools.<tool>.remoteApi.credentialRef` 为准，不再使用 `tools.<tool>.remoteApi.transport`。
   - 当 selected secret backend 不可写，或 `tool/provider` 组合无法唯一收敛到 canonical provider/vendorBinding pairing 时，provider-onboarding seam 必须 fail-closed，而不是回退到 host-side heuristics。
   - 真实 runtime/docs/support truth rollout 由 `project-116-vscode-direct-provider-onboarding-rollout` 承接。

## 9. Detail Docs

1. Contract:
   - `contracts/governance-surface-client-contract.md`
   - `contracts/vscode-governance-workbench-surface-contract.md`
   - `contracts/local-user-config-and-secret-command-contract.md`
   - `contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
   - `contracts/governance-host-distribution-contract.md`
   - `contracts/governance-adoption-pack-install-contract.md`
2. ADR:
   - `adrs/desktop-command-center-and-vscode-editor-companion-split.md`
   - `adrs/vscode-primary-full-governance-workbench.md`
   - `adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
   - `adrs/host-native-distribution-and-target-specific-consumption.md`
   - `adrs/adopter-productization-priority-and-surface-sequencing.md`
   - `adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
   - `adrs/current-surface-baseline-classification-and-followup-decomposition.md`
   - `adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
   - `adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
