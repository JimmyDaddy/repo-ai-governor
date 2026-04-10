# Runtime CLI Interactive Shell Module Overview

- Status: active
- Date: 2026-04-06
- Module ID: `runtime.cli-interactive-shell`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 CLI 的命令内 React 壳层、长时命令运行中 React shell 与 session-first 终端壳层收敛为统一的本地交互模块，确保默认人类入口、运行中进度反馈、slash command、resume continuity、`stderr` 输出边界与运行时回退都服从同一条可治理 contract。

## 2. 职责边界

1. 解析并落实 `none / classic / react / tui / session-shell` 等本地 UI 选择规则。
2. 管理命令内 React shell、长时命令 running shell 与 session-first shell 的生命周期、`SIGINT` 清理与 classic fallback。
3. 承载 transcript、composer、slash command palette、Ink-owned foreground input 与 command handoff preview 的 presenter 语义，但不拥有 canonical session truth。
4. 约束所有 live shell 只向 `stderr` 渲染，保持 `stdout` 机器输出稳定。
5. 为 `init / connect / workspace / upgrade / workflow` 等命令 surface 提供统一交互 seam，并为长时命令定义 running-state / elapsed / progress-panel 的共享 presenter 语义。
6. 为 `repo-ai-governor` 无子命令默认进入的本地 session shell 定义入口 contract 与 resume baseline。
7. 为命令执行期的 progress sink、AbortSignal cancel seam 与 React shell running panel 定义统一产品边界，但不让命令 executor 直接持有 Ink/React 实例。
8. 为 session-shell transcript 的 render-kind、command recap / collaboration recap / system notice 分层、assistant Markdown 内容块，以及 `session.main` live draft / thinking / tool-use 的 transcript-native 呈现定义正式 presenter 方向，但不把真正的命令 running dock 退化为 append-only transcript 日志。
9. 为 service-owned `session.main` supervisor 的 answer / follow-up / command handoff / low-risk direct-execute skill / role-collaboration 结果提供统一 transcript 与 recap presenter seam，并在 `preview_confirm` 与 `direct_execute` continuity 之间保持一致的 shell surface，但不在 CLI 侧重新拥有 supervisor runtime 决策逻辑。
10. 消费 service-owned `session.main` capability explanation turn metadata，包括 capability answer kind、referenced capability ids 与 suggested follow-up actions，并把它们渲染为 transcript-native affordance；但不得把这些 affordance 升级为本地自动执行器，也不得把 shell-local builtin commands 误建模成 orchestration-owned capability truth。
11. 当 shared session truth 后续暴露 presenter-safe continuation summaries 时，CLI 只能把它们用作 transcript / resume / diagnostics affordance；不得直接消费 raw provider handle、slot map 或 provider-private continuation semantics。
12. 为 interactive CLI command surface 的 maturity layering、thin-baseline enhancement priority 与 companion contract linked-input policy 提供正式 planning ADR，但不得把优先级分析误当作 command runtime truth。

## 3. 非目标

1. 不实现深度鼠标事件、拖拽式面板、alternate screen 全屏 TUI。
2. 不改变现有显式子命令、退出码或 `pretty/plain/json` 输出 contract。
3. 不让 CLI 进程成为 canonical session state owner。
4. 不复制 `CliGovernanceRuntime`、输出 presenter 或 i18n runtime 的业务逻辑。
5. 不引入跨语言 UI 子系统。
6. 不把 progress event / cancel seam 设计成绑定某个具体 UI 实现的专有协议。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`
4. `architecture.governance-boundary`

## 5. Imported Contracts

1. `contract.runtime.graph-execution.v1`

## 6. Exported Contracts

1. `contract.cli.interactive-shell.v1`
2. `contract.cli.session-shell.v1`

## 7. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`cli_ui_change`、`command_surface_change` 时加载。
2. 默认只加载 overview 与 direct contract，不递归展开 GUI/command 实现细节。
3. 当问题涉及 workflow 命令树、session-first 入口、resume continuity、`stderr` 渲染或 shell lifecycle 时，优先补载本模块 contract/ADR。

## 8. Cutover Notes

1. `v1` 的命令内 React shell 仍然是本模块的有效组成部分，不因为 session-first 方案而失效。
2. `v2` 起，本模块额外承载“无子命令进入常驻会话”的本地人类入口语义，但不破坏显式子命令和自动化路径。
3. session transcript、resume pointer 与 command handoff summary 必须由 local orchestration service 托管；CLI 只做 client + presenter。
4. future desktop 应消费同一份 service-backed session DTO，而不是复制第二套 session state。
5. focused Ink-owned input formalization 规定 session shell 的默认 foreground input owner 为 Ink；`readline` 只保留为 fallback seam。
6. 截至 `2026-03-30`，默认 session-shell TTY path 已完成 Ink-owned input cutover，live `/` palette、`Tab` completion、`Up/Down` highlight、`Esc` close 与 `Ctrl+L` clear-screen 已进入正式实现与测试闭环。
7. 截至 `2026-03-30`，`v3` formal direction 已接受“长时命令 running shell + structured progress events + AbortSignal cancel seam”；该方向已进入正式 module docs，但代码实现由 `project-032-command-live-progress-react-shell-productization` 承接，不应误解为已经交付完成。
8. 截至 `2026-03-31`，`v4` formal direction 已接受“structured session shell + markdown content blocks”；该方向正式要求把 running progress 与历史 transcript 分层，并允许 assistant 完成态消息、帮助文本和 command recap 进入 Markdown 呈现，但真实 renderer / batching rollout 仍由 `project-032` follow-up sprint 承接。
9. 截至 `2026-03-31`，`v5` formal direction 已接受“service-owned session.main supervisor + role subagents / handoffs”；CLI shell 继续只消费 service-backed turn outcome，并负责把 direct answer、follow-up、command handoff preview 与 collaboration recap 渲染为统一 transcript/presenter 语义，真实 supervisor runtime productization follow-up 由 `project-035-session-main-supervisor-and-role-subagent-productization` 承接。
10. 截至 `2026-03-31`，`v5.1` presenter semantics 已补充 `collaboration_recap` render-kind；role-based parallel/serial collaboration 的 recap、worker summary 与 handoff context 必须通过独立 transcript kind 呈现，避免继续挤占通用 `markdown` 或 `command_recap` 语义槽位。
11. 截至 `2026-04-01`，在既有 `v5` supervisor formal direction 基础上，已进一步接受“conversation-first chatability + risk-tiered natural-language skill handoff”；session shell 现需同时消费 `preview_confirm` 与 `direct_execute` 两类受治理 continuity，并以同一份 shared session truth 呈现 `help`、`doctor`、post-connect readiness follow-up 与 scope-resolved `review` 等低风险 skill 的执行/回放语义。
12. 截至 `2026-04-01`，`session.main` streaming presenter 已接受“transcript-first live conversation”补充方向：对话流的 draft/thinking/tool-use 应优先进入 transcript 主画布，只有真正的命令执行进度继续停留在 progress panel / running dock。
13. 截至 `2026-04-02`，`v6` formal direction 已接受“service-owned capability explainer + contextual command guidance”补充方向：session shell 必须消费 capability explanation turn metadata 与 suggested-action affordance，但 governed capability catalog 只拥有可解释的 bridge capabilities，`/confirm`、`/cancel`、`/clear`、`/exit`、`/resume` 等 shell-local builtins 继续留在 CLI registry 本地治理。
14. 截至 `2026-04-04`，在既有 session truth consumer 方向基础上，CLI shell 现进一步接受“presenter-safe provider continuation summary consumer”补充边界：shell 可以展示 continuation reuse / invalidation 的摘要结果，但 raw provider handle 与 slot lifecycle 仍属于 runtime/service seam。
15. 截至 `2026-04-04`，本模块进一步接受“CLI command capability maturity layering + thin-baseline enhancement priority”补充方向：`plan / review / review-verify / upgrade` 现被正式视为 linked thin-baseline command set；后续立项默认需联读成熟度 ADR 与各自 companion contract draft，但该优先级分析不进入 command runtime truth。
16. 截至 `2026-04-06`，本模块进一步接受“standards-native review engine presentation”补充方向：`review / review-verify` 的 CLI surface 应显式区分 deterministic rule findings、standards-guided findings 与 residual risk observations，并把 provenance-aware closure 结果呈现为 review artifact / transcript affordance，但不得在 CLI 本地重算 review engine 语义。
17. 截至 `2026-04-10`，本模块进一步接受“session.main prompt-first command model split”补充方向：session shell 的 discoverability/presenter 现需显式区分 raw `@role` expert surface、AI fixed workflow slash command、deterministic utility slash command 与 explain-only affordance；`/verify` 不再作为 public discoverable command 保留，而 `/run` 继续保留但只能以 reusable governed execution flow 的 narrowed wording 对用户展示。

## 9. Detail Docs

1. Contract:
   - `contracts/cli-interactive-shell-contract.md`
   - `contracts/cli-session-shell-contract.md`
2. ADR:
   - `adrs/session-first-shell-and-service-owned-session-state.md`
   - `adrs/ink-owned-input-and-action-driven-session-shell.md`
   - `adrs/live-command-progress-and-running-react-shell.md`
   - `adrs/structured-session-output-and-markdown-content-blocks.md`
   - `adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
