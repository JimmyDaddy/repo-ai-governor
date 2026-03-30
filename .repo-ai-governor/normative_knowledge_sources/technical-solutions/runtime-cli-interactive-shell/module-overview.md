# Runtime CLI Interactive Shell Module Overview

- Status: active
- Date: 2026-03-30
- Module ID: `runtime.cli-interactive-shell`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 CLI 的命令内 React 壳层与 session-first 终端壳层收敛为统一的本地交互模块，确保默认人类入口、slash command、resume continuity、`stderr` 输出边界与运行时回退都服从同一条可治理 contract。

## 2. 职责边界

1. 解析并落实 `none / classic / react / tui / session-shell` 等本地 UI 选择规则。
2. 管理命令内 React shell 与 session-first shell 的生命周期、`SIGINT` 清理与 classic fallback。
3. 承载 transcript、composer、slash command palette、Ink-owned foreground input 与 command handoff preview 的 presenter 语义，但不拥有 canonical session truth。
4. 约束所有 live shell 只向 `stderr` 渲染，保持 `stdout` 机器输出稳定。
5. 为 `init / connect / workspace / upgrade / workflow` 等命令 surface 提供统一交互 seam。
6. 为 `repo-ai-governor` 无子命令默认进入的本地 session shell 定义入口 contract 与 resume baseline。

## 3. 非目标

1. 不实现深度鼠标事件、拖拽式面板、alternate screen 全屏 TUI。
2. 不改变现有显式子命令、退出码或 `pretty/plain/json` 输出 contract。
3. 不让 CLI 进程成为 canonical session state owner。
4. 不复制 `CliGovernanceRuntime`、输出 presenter 或 i18n runtime 的业务逻辑。
5. 不引入跨语言 UI 子系统。

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

## 9. Detail Docs

1. Contract:
   - `contracts/cli-interactive-shell-contract.md`
   - `contracts/cli-session-shell-contract.md`
2. ADR:
   - `adrs/session-first-shell-and-service-owned-session-state.md`
   - `adrs/ink-owned-input-and-action-driven-session-shell.md`
