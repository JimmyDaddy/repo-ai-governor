# CLI Session Shell Contract

- Status: active
- Date: 2026-04-01
- Contract ID: `contract.cli.session-shell.v1`
- Producer Module: `runtime.cli-interactive-shell`

## 1. 目标

定义 `repo-ai-governor` 作为本地人类入口时的 session-first terminal shell contract，使自然语言对话、slash command、resume continuity、risk-tiered governed skill execution 与 command handoff 可以在不破坏既有显式子命令和 machine-readable output 的前提下共存。

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
16. `foreground_input_owner`
17. `foreground_focus_target`
18. `input_action_contract`
19. `transcript_render_kind`
20. `message_tone`
21. `artifact_backlinks`
22. `turn_response_mode`
23. `turn_interaction_mode`
24. `turn_selected_surface`
25. `turn_selected_by`
26. `turn_invoked_role_ids`
27. `turn_skill_id`
28. `turn_skill_version`
29. `turn_skill_risk_tier`
30. `turn_confirmation_mode`
31. `turn_execution_path`

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
6. `foreground_input_owner`
   - `ink`
   - `readline_fallback`
7. `foreground_focus_target`
   - `composer`
   - `palette`
   - `handoff_preview`
8. `transcript_render_kind`
   - `plain_text`
   - `markdown`
   - `system_notice`
   - `command_recap`
   - `collaboration_recap`
9. `turn_response_mode`
   - `answer`
   - `follow_up_question`
   - `command_handoff_preview`
   - `role_collaboration`
10. `turn_interaction_mode`
   - `direct_answer`
   - `single_role_delegate`
   - `serial_role_collaboration`
   - `parallel_role_fanout`
   - `command_handoff`
11. `turn_skill_risk_tier`
   - `not_applicable`
   - `low`
   - `elevated`
   - `high`
12. `turn_confirmation_mode`
   - `not_applicable`
   - `not_required`
   - `required`
13. `turn_execution_path`
   - `answer_only`
   - `preview_confirm`
   - `direct_execute`
   - `role_collaboration`

## 4. Required Constraints

1. 只有在 `TTY + pretty + interactive + no subcommand` 时，CLI 才允许默认进入 session shell。
2. `--help`、显式子命令、`--output json`、`--output plain`、`--no-interactive` 与非 TTY 场景必须不进入 session shell。
3. session shell 的 live UI 只能渲染到 `stderr`，不得污染 `stdout`。
4. 普通文本与 slash command 必须走显式语法分流；普通文本进入主 agent turn，`/command` 进入 slash router。
5. `foreground_input_owner` 在默认 live session-shell 路径中必须为 `ink`；`readline_fallback` 只能用于 non-TTY、debug 或 Ink/raw-mode 不可用的保底路径。
6. `Up/Down`、`Tab`、`Esc`、`Ctrl+L` 等前台键盘语义必须通过同一条 action-driven input contract 收口，不允许再依赖 frame 外 line editor 隐式处理。
7. CLI 只允许持有 presenter 级本地 view state；canonical session state、resume pointer、transcript 与 command handoff summary 必须由 local orchestration service 托管。
8. `/exit` 只退出当前前台会话界面，不删除已保存 transcript；`/resume [session-id]` 负责恢复最近一次或指定 session。
9. 会话外允许提供 `repo-ai-governor resume [session-id]` 入口；不建议提供顶层 `repo-ai-governor exit`。
10. `cli_handoff` 类型的高副作用命令必须先展示规范化命令预览并得到显式确认，再进入执行。
11. CLI 与 future desktop 必须共享同一套 session DTO 语义；差异只能存在于 presenter 层，不得复制第二套 session state owner。
12. `transcript_items` 必须允许 presenter 区分至少 `plain_text / markdown / system_notice / command_recap / collaboration_recap` 五类 render-kind；不得再假设所有消息都只能退化成单一 `label + lines[]` 视觉模型。
13. 正在运行中的 progress、heartbeat、elapsed 与 cancel affordance 必须停留在 session-shell running dock 或等价动态区域，不得通过无限追加 transcript 项目来伪装 live 状态。
14. assistant 完成态消息、帮助文本和 command recap 允许进入 Markdown content-block presenter path，但 `json/plain` 与 non-interactive contract 不得因该 presenter 能力发生 schema 变化。
15. `artifact_backlinks` 只能表示用户可回看的路径摘要；不得把机器输出 payload 自身嵌入 transcript 富文本中。
16. 当 `turn_response_mode=answer` 时，service-owned turn payload 必须带真实 `assistantMessage`；session shell 不得再把 metadata-only recap 伪装成回答完成态。
17. `turn_interaction_mode`、`turn_selected_surface`、`turn_selected_by` 与 `turn_invoked_role_ids` 只能来自 shared session event payload；CLI shell 只能消费这些字段，不得在 presenter 层本地推断或重写 supervisor/runtime 决策。
18. connected roles 如需呈现在 session shell 中，必须通过 service-owned `session.main` outcome 以 delegate/collaboration metadata 的形式暴露；CLI 不得直接把 projection descriptor 当作本地执行 truth 使用。
19. role collaboration 的最终 recap 可以进入 `command_recap` 或等价结构化 transcript presenter path，但运行中的 progress、heartbeat、elapsed 与 cancel affordance 仍必须停留在 running dock，而不是无限追加 transcript。
20. 自然语言 skill turn 必须先经过 service-owned risk/policy gate；CLI 必须只消费 `turn_skill_*`、`turn_confirmation_mode` 与 `turn_execution_path` 字段，不得在 presenter 层本地重算“是否需要确认”。
21. 当 `turn_execution_path=direct_execute` 且 `turn_confirmation_mode=not_required` 时，shell 必须允许受治理执行直接继续，不得额外插入 synthetic preview；但 transcript / resume / audit continuity 仍必须保留“这是 skill execution 而不是普通闲聊回答”的事实。
22. 当 `turn_execution_path=preview_confirm` 时，shell 必须继续保持现有 preview + explicit confirmation 行为，并保证 `/clear` 与 `resume` 后仍可恢复 pending handoff。
23. 零副作用能力发现 turn（例如 `help`）可根据 service-owned outcome 走 `answer` 或 `direct_execute`；两条路径都不得强制多余确认，也不得绕过 shared session truth。

## 5. Consumers

1. `entry.cli`
2. `runtime.orchestration`
3. `integrations.desktop`

## 6. Compatibility

1. `v1` 只约束 session-first local shell 的最小字段与行为边界，不要求首轮实现已经覆盖所有 deferred commands。
2. `v1` 保留现有显式子命令树的自动化兼容性；session-first 是新增默认人类入口，不是替换机器入口。
3. `v1` 允许把 session routing setting command 暂时保留为 future command，并在真正落地时以 `/model`、`/agent` 或 `/routing` 中的一种命名收口。
4. `v1` 允许 session shell 从 `readline` foreground input 迁移到 Ink-owned input，只要上述字段与治理边界保持稳定。
5. `v1` 现正式接受“结构化壳层 + Markdown 内容块”方向，但这只定义 presenter/contract 边界，不等于 renderer 已在代码面全面交付；真实 rollout follow-up 由 `project-032-command-live-progress-react-shell-productization` 的 output-presentation sprint 承接。
6. `v1` 现正式接受“service-owned session.main supervisor + role subagents / handoffs”方向；第一阶段 rollout 允许只交付 direct answer、command handoff preview 与 `1` 条 role-subagent bootstrap path，再逐步扩展 richer collaboration/streaming/sidecar parity。
7. `v1` 现进一步接受“conversation-first chatability + risk-tiered natural-language skill handoff”补充方向；低风险、只读、scope-resolved skill 可走 governed `direct_execute`，但 state-mutating、高成本或高歧义 skill 仍保留 `preview_confirm`。
