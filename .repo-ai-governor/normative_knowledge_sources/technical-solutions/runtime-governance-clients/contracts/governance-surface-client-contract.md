# Governance Surface Client Contract

- Status: active
- Date: 2026-04-05
- Contract ID: `contract.runtime.governance-surface-client.v1`
- Producer Module: `runtime.governance-clients`

## 1. 目标

定义 desktop governance command center 与 VS Code editor companion 共同遵守的最小 surface-client contract，使多表面入口可以共享 `local orchestration service` 真值、query/command seam 与 handoff 语义，而不演化出平行 runtime。

## 2. Minimum Fields

1. `surface_id`
2. `surface_role`
3. `truth_owner`
4. `workspace_id`
5. `workspace_root`
6. `session_id`
7. `execution_id`
8. `pending_hitl`
9. `query_capabilities`
10. `command_capabilities`
11. `handoff_targets`
12. `continuity_tokens`
13. `current_context_summary`
14. `policy_evidence_ref`
15. `artifact_backlinks`
16. `review_backlinks`
17. `notification_state`
18. `workspace_trust_state`
19. `ui_density`
20. `webview_usage_mode`

## 3. Allowed Values

1. `surface_id`
   - `desktop_command_center`
   - `vscode_editor_companion`
2. `surface_role`
   - `outer_loop_supervision`
   - `inner_loop_editor_companion`
3. `truth_owner`
   - `local_orchestration_service`
4. `workspace_trust_state`
   - `trusted`
   - `limited`
   - `unknown`
5. `ui_density`
   - `overview`
   - `focused`
6. `webview_usage_mode`
   - `not_required`
   - `detail_only`

## 4. Required Constraints

1. 所有 surface 的 canonical truth owner 必须为 `local_orchestration_service`；desktop 与 VS Code 只能消费 service-owned DTO / query / command seam。
2. desktop 不得通过 filesystem bypass 读取 `.repo-ai-governor/**` canonical truth；review/artifact/transcript 只能走 service-owned query seam。
3. VS Code 插件不得维护 extension-only 的 execution/session/policy state；editor 内视图、chat participant 与 code actions 只能消费 shared identifiers 与 service-backed read model。
4. `surface_role=outer_loop_supervision` 的 desktop 负责 multi-workspace、execution board、HITL inbox、review queue、automation inbox 与 policy/evidence 导航；不得退化成单一聊天壳。
5. `surface_role=inner_loop_editor_companion` 的 VS Code 插件负责当前文件/selection、lightweight run/review/hitl/context view、chat participant 与 editor-local handoff；不得被扩张为 full IDE replacement。
6. VS Code 插件应优先使用 views/tree views/chat participant/commands/code actions；`webview_usage_mode` 只能在 detail drill-down 必要时进入 `detail_only`，不得将整个插件设计为 webview shell。
7. 所有 surface 必须共享 `session_id / execution_id / artifact_backlinks / review_backlinks / continuity_tokens` 的语义，不得各自发明平行标识。
8. handoff 必须是显式 affordance；`open editor / open worktree / open terminal / open review doc` 只能基于 service-owned handoff target 执行，不得要求 UI 自行重建路径真值。
9. user-facing 文案、状态标签与建议动作必须经过 shared i18n / reporting seam，不得在不同 surface 中长期维护漂移的独立文案真值。
10. `v1` 不要求 desktop 与 VS Code 的 UI 或能力完全对等；唯一必须对等的是 truth boundary、identifier semantics 与 governance-safe action contract。

## 5. Consumers

1. `apps/desktop`
2. future `VS Code extension`
3. `runtime.orchestration`
4. `runtime.agent-projection`
5. `runtime.cli-interactive-shell`

## 6. Compatibility

1. `v1` 只 formalize surface split、truth boundary 与最小 action/query seam，不要求首轮实现已覆盖全部 deferred panels。
2. `v1` 允许 desktop 与 VS Code 以不同节奏 rollout；desktop 可以先完成 actionable console baseline，再由 VS Code 插件承接 editor companion MVP。
3. `v1` 允许 VS Code 插件暂时只实现轻量 view container + chat participant + commands/code actions，只要不违背上述 truth boundary。
