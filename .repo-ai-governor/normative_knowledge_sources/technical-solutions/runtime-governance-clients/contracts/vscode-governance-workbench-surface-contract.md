# VS Code Governance Workbench Surface Contract

- Status: active
- Date: 2026-04-16
- Contract ID: `contract.runtime.vscode-governance-workbench-surface.v1`
- Producer Module: `runtime.governance-clients`

## 1. 目标

定义 VS Code 作为 `primary governance workbench` 时必须遵守的最小 surface contract，确保更重的 workbench UI、task/workflow/review/automation/adoption surface 与 temporary CLI bridge 仍然只消费 shared local orchestration service 的真值，而不把 extension host 演化成新的 runtime owner。

## 2. Minimum Fields

1. `surface_id`
2. `surface_role`
3. `truth_owner`
4. `native_entrypoints[]`
5. `workbench_panels[]`
6. `query_capability_classes[]`
7. `command_capability_classes[]`
8. `temporary_bridge_capability_classes[]`
9. `webview_usage_mode`
10. `public_support_level`
11. `desktop_relationship`
12. `handoff_targets[]`
13. `continuity_tokens[]`

## 3. Allowed Values

1. `surface_id`
   - `vscode_governance_workbench`
2. `surface_role`
   - `primary_governance_workbench`
3. `truth_owner`
   - `local_orchestration_service`
4. `webview_usage_mode`
   - `detail_only`
   - `workbench_panel_allowed`
5. `public_support_level`
   - `companion_upgraded`
   - `workbench_baseline_in_progress`
   - `primary_workbench_claim`
6. `desktop_relationship`
   - `foundation_only_secondary_surface`
   - `coexisting_secondary_surface`
   - `optional_shell_candidate`

## 4. Required Constraints

1. VS Code workbench 的 canonical truth owner 必须始终为 `local_orchestration_service`；task/workflow/review/automation/adoption/host state 只能通过 service-owned DTO、query 与 command seam 消费。
2. `native_entrypoints[]` 必须优先覆盖 `TreeView / Commands / Chat / Code Actions`；`workbench_panels[]` 只允许承接多对象 board、artifact/review workbench、workflow studio、automation queue 与 adoption / host operations 这类 detail-heavy surface。
3. `workbench_panel_allowed` 只表示允许 richer workbench panel，不表示允许 extension host 直接读取 `.repo-ai-governor/**` canonical files，也不表示允许本地维护 shadow execution/session/task state。
4. `query_capability_classes[]` 至少要能覆盖 `task_board`、`review_queue`、`workflow_preview`、`workflow_stage_progress`、`automation_queue`、`adoption_status` 与 `host_distribution_status` 的稳定分类；具体 query payload 仍由 aggregation facade contract 冻结。
5. `temporary_bridge_capability_classes[]` 只允许用于尚未 service-native 的 `adopt / host / verify / upgrade` 这类高价值 surface；每条 bridge 都必须回链 service-owned receipt/backlink，并具备显式 exit criteria。
6. `public_support_level=primary_workbench_claim` 只有在 workflow studio、adoption/host cutover、desktop decision surface 与 support-truth refresh evidence 同窗闭环后才允许出现；在此之前只能保持 `companion_upgraded` 或 `workbench_baseline_in_progress`。
7. `desktop_relationship` 可以在 `foundation_only_secondary_surface -> coexisting_secondary_surface -> optional_shell_candidate` 之间演进，但不得在没有独立 desktop decision surface 的情况下被文档静默删除。
8. `handoff_targets[]` 与 `continuity_tokens[]` 必须继续复用 shared identifiers 语义，不得让 VS Code workbench 与 CLI / desktop 各自发明平行 handoff truth。

## 5. Consumers

1. `apps/vscode-extension`
2. `runtime.orchestration`
3. `runtime.cli-interactive-shell`
4. `integrations.desktop`
5. `docs/help/playbook/discoverability`

## 6. Compatibility

1. `v1` formalize 的是 VS Code primary workbench 的目标边界，不等于 public support truth 已在同一窗口完成切换。
2. `v1` 允许 companion-era `vscode_editor_companion` 继续作为 rollout 兼容语义存在，但它不再是 planning-side formal direction 的终局定义。
3. `v1` 允许 `adopt / host / verify / upgrade` 先通过 typed CLI bridge 暂存，只要 service-owned receipt/backlink 与 exit criteria 没有缺位。
