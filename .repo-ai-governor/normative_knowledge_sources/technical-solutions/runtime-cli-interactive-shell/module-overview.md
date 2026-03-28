# Runtime CLI Interactive Shell Module Overview

- Status: active
- Date: 2026-03-28
- Module ID: `runtime.cli-interactive-shell`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 CLI 的交互壳层、向导式表单、workflow 预览/编辑入口、输出流边界与运行时安全回退收敛为一条可治理的本地 shell contract，确保交互体验升级不会污染 machine output 或绕过现有 runtime contract。

## 2. 职责边界

1. 解析并落实 `none / classic / react / tui` 等 UI mode 的选择规则。
2. 管理 React 风格 shell 的生命周期、`SIGINT` 清理与 classic fallback。
3. 将命令描述、步骤状态、表单字段与验证结果映射为可渲染视图，但不拥有业务真相。
4. 约束 shell 仅向 `stderr` 渲染，保持 `stdout` 机器输出稳定。
5. 为 `init / connect / workspace / upgrade / workflow` 等命令 surface 提供统一交互 seam。

## 3. 非目标

1. 不实现深度鼠标事件、拖拽式面板、alternate screen 全屏 TUI。
2. 不改变现有命令语义、退出码或 `pretty/plain/json` 输出 contract。
3. 不复制 `CliGovernanceRuntime`、输出 presenter 或 i18n runtime 的业务逻辑。
4. 不引入跨语言 UI 子系统。

## 4. North Star References

1. `overall.graph-first-runtime`
2. `architecture.runtime-boundary`
3. `architecture.governance-boundary`

## 5. Exported Contracts

1. `contract.cli.interactive-shell.v1`

## 6. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`cli_ui_change`、`command_surface_change` 时加载。
2. 默认只加载 overview 与 direct contract，不递归展开 GUI/command 实现细节。
3. 当问题涉及 workflow 命令树、stderr 渲染或 shell lifecycle 时，优先补载本模块 contract。

## 7. Detail Docs

1. Contract:
   - `contracts/cli-interactive-shell-contract.md`
