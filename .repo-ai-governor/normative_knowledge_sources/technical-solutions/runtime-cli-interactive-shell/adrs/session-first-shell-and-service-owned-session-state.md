# Session-First Shell And Service-Owned Session State ADR

- Status: active
- Date: 2026-03-30
- Module ID: `runtime.cli-interactive-shell`
- ADR ID: `adr.runtime.cli-interactive-shell.session-first-service-owned-state.v1`

## 1. Context

`project-027` 已把 `runtime.cli-interactive-shell` 从 classic help-first CLI 推进到命令内 React shell baseline，但当前正式 contract 仍主要覆盖 `init / connect / workspace / upgrade / workflow` 这类显式子命令内部的交互壳层。新的 accepted draft 进一步提出了三项产品升级需求：

1. 直接执行 `repo-ai-governor` 时，应优先进入常驻 session shell，而不是打印 help。
2. 普通文本应直接进入主 agent 对话，slash command 则成为同一会话内的控制面。
3. session transcript、resume 与 command handoff summary 不能只保存在 CLI 内存里，否则 future desktop 无法接住同一条 session。

## 2. Decision

1. `runtime.cli-interactive-shell` 从“命令内 React shell 模块”升级为“命令内 shell + session-first shell”的统一模块。
2. 无子命令默认入口仅在 `TTY + pretty + interactive + no subcommand` 条件下进入 session shell，其余路径继续保持原有 Commander 语义。
3. session shell 采用“普通文本对话 + slash command 控制面 + command handoff preview/confirm”三段式交互，而不是把所有控制能力留在外层子命令树。
4. canonical session state 必须 service-owned，由 local orchestration service 托管；CLI 只做第一个 presenter/client。
5. future desktop 必须消费同一份 service-backed session DTO，而不是实现第二套独立 session state。
6. 顶层恢复入口允许 `resume`，但退出能力保留为会话内 `/exit` 与快捷键语义。

## 3. Consequences

1. 现有命令内 React shell contract 继续有效，但只覆盖 command-scoped surface；session-first shell 需要独立 exported contract。
2. `runtime.cli-interactive-shell` 现在显式依赖 `runtime.orchestration` 提供的 service-backed execution substrate，而不是把会话状态写死在 CLI 进程里。
3. `project-029-cli-session-first-agent-shell` 作为 follow-up stream 承接实现，不在本次 promotion 中直接扩展代码改造窗口。
4. session routing setting command 可以后置，不要求 MVP 首轮就以 `/model` 形式暴露给用户。
