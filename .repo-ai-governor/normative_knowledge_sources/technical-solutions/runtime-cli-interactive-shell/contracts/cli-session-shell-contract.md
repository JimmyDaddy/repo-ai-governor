# CLI Session Shell Contract

- Status: active
- Date: 2026-04-16
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
32. `turn_capability_answer_kind`
33. `turn_referenced_capability_ids`
34. `turn_suggested_actions`
35. `turn_delivery_phase`
36. `turn_delivery_pending_action`
37. `turn_delivery_related_artifact_paths`

## 3. Allowed Values

1. `shell_mode`
   - `session_shell`
   - `command_palette`
   - `command_handoff_preview`
   - `command_running`
   - `secure_local_capture`
2. `input_mode`
   - `plain_text`
   - `slash_command`
   - `secure_local`
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
   - `secure_capture`
8. `transcript_render_kind`
   - `plain_text`
   - `markdown`
   - `live_markdown`
   - `live_activity`
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
14. `turn_capability_answer_kind`
   - `overview`
   - `detail`
   - `examples`
   - `comparison`

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
10. `cli_handoff` 类型命令默认应直接执行；真正的高风险确认必须由具体命令契约或 service-owned policy/HITL gate 承接，shell 不得再发明一层额外 preview-confirm 门。
11. CLI 与 future desktop 必须共享同一套 session DTO 语义；差异只能存在于 presenter 层，不得复制第二套 session state owner。
12. `transcript_items` 必须允许 presenter 区分至少 `plain_text / markdown / live_markdown / live_activity / system_notice / command_recap / collaboration_recap` 七类 render-kind；不得再假设所有消息都只能退化成单一 `label + lines[]` 视觉模型。
13. `session.main` 对话流的 live draft、thinking 与 tool-use 可以通过 `live_markdown / live_activity` 进入 transcript 主画布；但真正的命令执行 progress、heartbeat、elapsed 与 cancel affordance 仍必须停留在 session-shell running dock 或等价动态区域，不能把长时命令运行态退化成无限追加 transcript。
14. assistant 完成态消息、帮助文本和 command recap 允许进入 Markdown content-block presenter path，但 `json/plain` 与 non-interactive contract 不得因该 presenter 能力发生 schema 变化。
15. `artifact_backlinks` 只能表示用户可回看的路径摘要；不得把机器输出 payload 自身嵌入 transcript 富文本中。
16. 当 `turn_response_mode=answer` 时，service-owned turn payload 必须带真实 `assistantMessage`；session shell 不得再把 metadata-only recap 伪装成回答完成态。
17. `turn_interaction_mode`、`turn_selected_surface`、`turn_selected_by` 与 `turn_invoked_role_ids` 只能来自 shared session event payload；CLI shell 只能消费这些字段，不得在 presenter 层本地推断或重写 supervisor/runtime 决策。
18. connected roles 如需呈现在 session shell 中，必须通过 service-owned `session.main` outcome 以 delegate/collaboration metadata 的形式暴露；CLI 不得直接把 projection descriptor 当作本地执行 truth 使用。
19. role collaboration 的最终 recap 可以进入 `command_recap` 或等价结构化 transcript presenter path，但运行中的 progress、heartbeat、elapsed 与 cancel affordance 仍必须停留在 running dock，而不是无限追加 transcript。
20. 自然语言 skill turn 必须先经过 service-owned risk/policy gate；CLI 必须只消费 `turn_skill_*`、`turn_confirmation_mode` 与 `turn_execution_path` 字段，不得在 presenter 层本地重算“是否需要确认”。
21. 当 `turn_execution_path=direct_execute` 且 `turn_confirmation_mode=not_required` 时，shell 必须允许受治理执行直接继续，不得额外插入 synthetic preview；但 transcript / resume / audit continuity 仍必须保留“这是 skill execution 而不是普通闲聊回答”的事实。
22. 当 `turn_execution_path=preview_confirm` 时，shell 仍需兼容既有 preview + explicit confirmation 行为，并保证 `/clear` 与 `resume` 后仍可恢复 pending handoff；但该路径不再是 default governed handoff baseline。
23. 零副作用能力发现 turn（例如 `help`）可根据 service-owned outcome 走 `answer` 或 `direct_execute`；两条路径都不得强制多余确认，也不得绕过 shared session truth。
24. 当 `turn_response_mode=answer` 且该 turn 实际属于 capability explanation 时，`turn_capability_answer_kind`、`turn_referenced_capability_ids` 与 `turn_suggested_actions` 必须来自 shared session payload；CLI shell 不得在 presenter 层自行猜测“这是不是 overview/detail answer”。
25. `turn_suggested_actions` 只能表示用户可点击/可追问的 follow-up affordance；shell 可以渲染，但不得自动执行、不得绕过既有 risk/policy gate，也不得把它们写成新的 pending handoff truth。
26. shell 如果需要统一呈现 governed capability discoverability 与 slash command palette，只能把 service-owned capability metadata 与 shell-local builtin metadata 在 presenter/registry 组合层合并；不得要求 `runtime.orchestration` 拥有 `/confirm`、`/cancel`、`/clear`、`/exit`、`/resume`、`/history`、`/search`、`/multiline`、`/status`、`/theme`、`/agent` 等 CLI-only builtin 的 canonical truth。
27. capability explanation 所展示的用户可见 prose 必须来自 locale-neutral capability seed 经 i18n 渲染后的结果；CLI 不得继续维护一份与 service-owned catalog 平行漂移的独立 help prose source。
28. session shell discoverability 必须把 raw `@role` expert entry 与 governed slash-command entry 明确区分；`@planner / @reviewer / ...` 不得被伪装成 slash bridge command。
29. governed slash entries 至少必须区分 `ai_fixed_workflow` 与 `deterministic_utility`：`/plan`、`/review`、`/review verify` 不能再呈现成 plain CLI bridge，而 `/plan sync`、`/workflow`、`/connect`、`/doctor`、`/workspace switch-branch` 继续属于 deterministic utility。
30. `/verify` 在 public command model 删除后，不得继续出现在 session-shell slash palette、launcher shortlist 或 help appendix 中；相关 readiness guidance 必须改写到 `connect`、`doctor` 或 workflow-local preflight 文案。
31. `/run` 可以继续出现在 discoverability surface 中，但 presenter copy 必须把它限制为 reusable governed execution flow，不得让 generic implementation ask 看起来默认等价于 `/run`。
32. 当 nested governed command 返回 `cli_output_v1` 结构化错误时，shell 必须优先解码 `message / hint / next_action` 并渲染成用户可执行的恢复提示；若 stdout 中出现重复 JSON 行或其他可恢复噪音，也不得把原始 JSON payload 直接当作 transcript 正文回显。
33. session shell 的默认可读性增强只允许调整 presenter 级 emphasis/dim usage、palette visible-row budget 与摘要截断宽度；实际字体大小仍由宿主终端/IDE 控制，不得新增 shell-local font-size flag、宿主字号集成或持久化字体偏好。
34. `/workspace` discoverability 可以在 slash palette 中显式暴露 `dry-run / execute / rollback / clear-config / switch-branch / set-ui-theme` 等 nested action，但这仍属于既有 `workspace` command family 的 presenter-level hint，不得引入新的 public command family；bare `/` launcher shortlist 也不得因此被 nested action 刷屏。
35. 当用户把 slash 前缀收窄到 `/workspace set-ui-theme` 时，palette 必须直接暴露现有 `workspace set-ui-theme <preset>` 的 preset-choice 子提示，并覆盖当前公开 preset catalog 真值（`governor / catppuccin / calm / tokyo-night / kanagawa / flexoki`）；同时允许 `Enter/Tab` 优先接受高亮的更具体子命令，而不是把缺 preset 的父命令直接提交为失败执行。
36. 当显式 `/secret set <keyName>` 被解析为 secure route 时，shell 必须在同一状态迁移中清空普通 slash/composer presenter state，并切换到 `shell_mode=secure_local_capture`、`input_mode=secure_local`、`foreground_focus_target=secure_capture`；后续 secret 输入不得再经过普通 composer/slash presenter。
37. 对 `/secret set <keyName>` 而言，只允许精确的 `keyName` authoring request 进入 secure-local path；一旦 secure route 被识别，额外 typed/pasted suffix 必须在 presenter-state commit 之前被拦截并丢弃，不得写入 `composer_value`、`slash_query`、palette suggestion/highlight state 或 `command_preview`。
38. `secure_local_capture` 的 raw buffer 只能存在于 shell-local ephemeral controller state；不得写入 `transcript_items`、`handoff_state` payload、`artifact_backlinks`、turn metadata、running dock、localized error strings 或 thrown error metadata。
39. `secure_local_capture` 成功、失败、取消与清理路径只允许追加 redacted system notice / summary；用户可见文字中不得包含 secret 原文、前后缀、长度或带 secret 的 command recap。
40. shell 在 secure-local path 中必须直接调用本地 secret mutation seam；不得把 raw secret 重新封装成 `bridgeArgv`、nested CLI JSON stdout/stderr payload 或其他可回放的 governed handoff artifact。
41. 当 turn 属于 `deliver` orchestration 时，shell 只能消费 shared session truth 中的 `turn_delivery_phase / turn_delivery_pending_action / turn_delivery_related_artifact_paths` 等 presenter-safe metadata；不得在本地根据 artifact 名称、slash 选择或用户输入重算 phase truth。
42. `deliver` 作为 requirement-to-CR parent workflow 时，默认 primary entry 仍是 conversational answer；若 presenter 暴露 `/deliver`，它也只能作为 discoverability alias，不得生成与自然语言入口并列的第二份 pending confirmation truth。
43. 当 `deliver` phase 指向 `requirement_review_pending`、`solution_review_pending`、`task_plan_commit_pending` 或 `review_verify_pending` 时，shell 只允许渲染待确认/待处理摘要与 artifact backlink；canonical approval、commit 与 resolution 必须回到各自底层 workflow/ledger/review surface。

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
7. `v1` 现进一步接受“conversation-first chatability + risk-tiered natural-language skill handoff”补充方向；governed skill handoff 默认走 `direct_execute`，而真正的高风险确认改由具体命令契约或 service-owned policy/HITL gate 暴露；`preview_confirm` 仅保留为兼容旧 session continuity 或未来被 service 明确要求的特例路径。
8. `v1` 现进一步接受“service-owned capability explainer + contextual command guidance”补充方向；capability explanation turn 仍属于 `answer` path，但 shell 需要额外消费 capability metadata 与 suggested-action affordance，同时保持 shell-local builtins 不被误并入 service-owned governed capability catalog。
9. `v1` 现进一步接受“prompt-first command model split”补充方向；`/plan`、`/review`、`/review verify` 作为 AI fixed workflow 呈现，`/plan sync` 与其他 utility slash command 继续保持 deterministic bridge，而 public `/verify` 被删除。
10. `v1` 现进一步接受“session-shell theme preset choice discoverability”补充方向；`/workspace set-ui-theme` 在 session shell 中需要暴露 preset-choice palette path，但这仍是既有 `workspace set-ui-theme <preset>` 语义的 presenter-level discoverability 增强。
11. `v1` 现进一步接受“显式 `/secret set <keyName>` secure local capture”补充方向；当前 formal scope 只覆盖 shell-initiated secure capture、pre-commit suffix rejection 与 redacted local mutation handoff，`session.main`-triggered secure-input outcome 以及 desktop / VS Code secure prompt parity 仍留在后续独立 solution。
12. `v1` 现进一步接受“web-inspired theme pack expansion”补充方向；新增 preset 仍必须复用同一套 shared preset enum、selector、slash palette 与 help discoverability 真值，不得为单个主题引入额外配置层或独立 command surface。
13. `v1` 现进一步接受“requirement-to-CR governed delivery orchestration”补充方向：`deliver` 作为 parent AI workflow 可以被 session shell 解释和引导，但 shell 只消费 phase summary / pending action / artifact backlinks，不额外拥有 requirement、solution、task-plan 或 review lifecycle 的 canonical state。
