# Governance Workbench Aggregation Facade Contract

- Status: active
- Date: 2026-04-16
- Contract ID: `contract.runtime.governance-workbench-aggregation-facade.v1`
- Producer Module: `runtime.orchestration`

## 1. 目标

定义面向 governance workbench 的 service-owned aggregation facade，使 VS Code primary workbench、CLI 与 future desktop 可以统一消费 task/review/workflow/automation/adoption/host operations 的 query/command seam，而不把 task ledger、review artifact 或 install receipt 真值迁入 runtime shadow state。

## 2. Minimum Fields

1. `query_capability_classes[]`
2. `command_capability_classes[]`
3. `authoritative_owner_map[]`
4. `projection_backlinks[]`
5. `temporary_bridge_capability_classes[]`
6. `bridge_exit_criteria[]`
7. `risk_gated_mutation_classes[]`
8. `allowed_consumers[]`

## 3. Allowed Values

1. `query_capability_classes`
   - `task_board`
   - `task_detail`
   - `task_execution_backlinks`
   - `review_queue`
   - `hitl_inbox`
   - `automation_queue`
   - `workbench_overview`
   - `workflow_catalog`
   - `workflow_preview`
   - `execution_graph`
   - `execution_stage_progress`
   - `adoption_status`
   - `host_distribution_status`
2. `command_capability_classes`
   - `governed_run`
   - `governed_review`
   - `review_verify`
   - `session_resume`
   - `execution_recover`
   - `execution_terminate`
   - `adopt_bootstrap`
   - `adoption_apply`
   - `host_export`
   - `host_verify`
   - `host_pack`
   - `upgrade`
3. `authoritative_owner_map`
   - `execution_sessions_hitl_queue`
   - `task_and_review_governance_surfaces`
   - `workflow_execution_ledger`
   - `adoption_and_host_receipts`
4. `temporary_bridge_capability_classes`
   - `adopt_bootstrap`
   - `adoption_apply`
   - `host_export`
   - `host_verify`
   - `host_pack`
   - `upgrade`
5. `risk_gated_mutation_classes`
   - `review_verify`
   - `host_operation`
   - `adoption_operation`
   - `workflow_mutation`

## 4. Required Constraints

1. `runtime.orchestration` 只拥有 aggregation facade 与 service-owned projection owner 身份；它不得把 `current-context + task-ledger sqlite + review artifacts`、execution ledger 或 install receipt 的 canonical truth 搬进新的 runtime shadow state。
2. `task_board / task_detail / task_execution_backlinks / review_queue` 这类 query 必须显式回链既有 canonical governance surfaces，并允许 consumer 追溯到 task card、tasks.csv、review artifact 或 handoff artifact。
3. `workflow_catalog / workflow_preview / execution_graph / execution_stage_progress` 必须继续来源于 graph-first runtime 与 execution ledger，而不是 UI 本地拼装的第二套 graph truth。
4. `adoption_status / host_distribution_status` 只能读取 install receipt、verification artifact、host distribution receipt 与 staged asset metadata 的 service-owned projection；不得把 CLI stdout/stderr 解析结果当作长期 canonical contract。
5. `temporary_bridge_capability_classes[]` 中的能力只有在 service-native seam 尚未到位时才允许保留；每条 bridge 都必须声明 exit criteria，并在 façade response 中回链 service-owned receipt/backlink。
6. 高风险 mutation 仍需经过既有 trust/policy gate；aggregation facade 不得因为提升了 VS Code workbench 地位就绕过 `allow/confirm/block/escalate` 流程。
7. facade consumers 只能是受治理 surface：VS Code workbench、CLI、future desktop、docs/playbook/discoverability；第三方 surface 若要复用，必须先接入同一 truth boundary。

## 5. Consumers

1. `runtime.governance-clients`
2. `apps/cli`
3. `integrations.desktop`
4. `runtime.cli-interactive-shell`
5. `docs/help/playbook/discoverability`

## 6. Compatibility

1. `v1` formalize 的是 aggregation facade 的 owner split 与最小 seam 分类，不等于所有 query/command 已在同一窗口完成代码交付。
2. `v1` 允许 adoption/host/upgrade 相关能力先保留 typed CLI bridge，只要 exit criteria、receipt backlink 与 service-side risk gate 同时存在。
3. `v1` 不改变既有 `deliver / plan / review / review_verify` 的 canonical child workflow truth；它只负责让 workbench surface 稳定消费这些真值的 projection/backlink。
