# CLI Session Shell Contract

- Status: active
- Date: 2026-03-30
- Contract ID: `contract.cli.session-shell.v1`
- Producer Module: `runtime.cli-interactive-shell`

## 1. 目标

定义 `repo-ai-governor` 作为本地人类入口时的 session-first terminal shell contract，使自然语言对话、slash command、resume continuity 与 command handoff 可以在不破坏既有显式子命令和 machine-readable output 的前提下共存。

## 2. Minimum Fields

1. `session_id`
2. `shell_mode`
3. `input_mode`
4. `transcript_items`
5. `composer_value`
6. `slash_query`
7. `slash_suggestions`
8. `highlighted_command`
9. `command_preview`
10. `handoff_state`
11. `cwd`
12. `workspace_summary`
13. `output_contract`
14. `persistence_owner`
15. `resume_selector`

## 3. Allowed Values

1. `shell_mode`
   - `session_shell`
   - `command_palette`
   - `command_handoff_preview`
   - `command_running`
2. `input_mode`
   - `plain_text`
   - `slash_command`
3. `handoff_state`
   - `idle`
   - `previewing`
   - `awaiting_confirmation`
   - `running`
   - `success`
   - `failure`
   - `cancelled`
4. `output_contract`
   - `pretty`
   - `plain`
   - `json`
5. `persistence_owner`
   - `local_orchestration_service`

## 4. Required Constraints

1. 只有在 `TTY + pretty + interactive + no subcommand` 时，CLI 才允许默认进入 session shell。
2. `--help`、显式子命令、`--output json`、`--output plain`、`--no-interactive` 与非 TTY 场景必须不进入 session shell。
3. session shell 的 live UI 只能渲染到 `stderr`，不得污染 `stdout`。
4. 普通文本与 slash command 必须走显式语法分流；普通文本进入主 agent turn，`/command` 进入 slash router。
5. CLI 只允许持有 presenter 级本地 view state；canonical session state、resume pointer、transcript 与 command handoff summary 必须由 local orchestration service 托管。
6. `/exit` 只退出当前前台会话界面，不删除已保存 transcript；`/resume [session-id]` 负责恢复最近一次或指定 session。
7. 会话外允许提供 `repo-ai-governor resume [session-id]` 入口；不建议提供顶层 `repo-ai-governor exit`。
8. `cli_handoff` 类型的高副作用命令必须先展示规范化命令预览并得到显式确认，再进入执行。
9. CLI 与 future desktop 必须共享同一套 session DTO 语义；差异只能存在于 presenter 层，不得复制第二套 session state owner。

## 5. Consumers

1. `entry.cli`
2. `runtime.orchestration`
3. `integrations.desktop`

## 6. Compatibility

1. `v1` 只约束 session-first local shell 的最小字段与行为边界，不要求首轮实现已经覆盖所有 deferred commands。
2. `v1` 保留现有显式子命令树的自动化兼容性；session-first 是新增默认人类入口，不是替换机器入口。
3. `v1` 允许把 session routing setting command 暂时保留为 future command，并在真正落地时以 `/model`、`/agent` 或 `/routing` 中的一种命名收口。
