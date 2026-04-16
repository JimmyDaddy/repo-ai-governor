# Delivery Workflow Summary And Artifact Backlink Contract

- Status: active
- Date: 2026-04-16
- Contract ID: `contract.runtime.delivery-workflow-summary-projection.v1`
- Producer Module: `runtime.durable-storage`

## 1. 目标

定义 delivery orchestration 在 durable storage 中的 presenter-safe summary / backlink projection 边界，避免 shell、reporting 或 follow-up automation 为了显示 phase 状态而重新发明第二套 workflow truth。

## 2. Minimum Fields

1. `workflow_id`
2. `current_phase`
3. `approved_delivery_brief_path`
4. `related_artifact_paths[]`
5. `pending_confirmation`
6. `blocked_reason`
7. `phase_result_summaries[]`
8. `selected_target_stream`

## 3. Required Constraints

1. 本 contract 只描述 durable projection，不拥有 `deliver` workflow 的 producer authority；producer 仍是 `runtime.orchestration`。
2. `approved_delivery_brief_path` 必须指向已经批准的 durable brief 或等价 approval receipt；不得写入 shared-session preview path。
3. `related_artifact_paths[]` 只允许存放 presenter-safe backlink，例如：
   - approved durable brief
   - technical-solution review artifact
   - sprint plan / tasks.csv
   - canonical review artifact
4. `pending_confirmation` 与 `blocked_reason` 只能作为 resume / diagnostics / presenter hint；不得替代底层 workflow 的 commit 或 approval truth。
5. `phase_result_summaries[]` 只允许写入摘要，不得写入与底层 artifact 并列竞争的完整正文或 decision payload。

## 4. Consumers

1. `runtime.cli-interactive-shell`
2. `integrations.desktop`
3. `docs/help/playbook/discoverability`

## 5. Compatibility

1. `v1` 可以由独立表、projection view 或等价 read-model 承载，不强制单一物理 schema。
2. `v1` 与 `contract.runtime.session-durable-storage.v1` 互补：前者定义 session durable truth baseline，后者定义 delivery workflow summary projection。
