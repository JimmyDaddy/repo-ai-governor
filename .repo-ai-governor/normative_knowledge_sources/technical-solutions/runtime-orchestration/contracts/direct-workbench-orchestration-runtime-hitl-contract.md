# Direct Workbench Orchestration, Runtime Status Bus, And HITL Contract

- Status: active
- Date: 2026-04-22
- Contract ID: `contract.runtime.direct-workbench-orchestration-runtime-hitl.v1`
- Producer Module: `runtime.orchestration`

## 1. 目标

定义 VS Code direct-workbench follow-up 所需的最小 runtime contract，使 workflow draft session、runtime status bus 与 HITL decision packet 都能够以 service-owned seam 暴露，而不把 canonical workflow / governance / risk truth 迁入 extension-local state。

## 2. Minimum Capability Fields

1. `query_seams[]`
2. `mutation_seams[]`
3. `workflow_draft_session_fields[]`
4. `role_lane_status_fields[]`
5. `session_continuity_fields[]`
6. `hitl_decision_packet_fields[]`
7. `bridge_exit_criteria[]`
8. `risk_contract_refs[]`

## 3. Allowed Values

1. `query_seams`
   - `queryWorkflowCatalog`
   - `queryWorkflowDraftSession`
   - `queryExecutionGraph`
   - `queryExecutionStageProgress`
   - `queryRoleLaneStatus`
   - `queryTaskExecutionBacklinks`
   - `querySessionContinuity`
   - `queryHitlDecisionPacket`
2. `mutation_seams`
   - `startWorkflowDraft`
   - `updateWorkflowDraftNode`
   - `updateWorkflowDraftEdge`
   - `updateWorkflowDraftPolicy`
   - `validateWorkflowDraft`
   - `commitWorkflowDraft`
   - `submitHitlDecision`
   - `recoverExecution`
   - `terminateExecution`
3. `workflow_draft_session_fields`
   - `workflow_draft_id`
   - `draft_revision`
   - `base_definition_revision`
   - `template_id`
   - `entry_mode`
   - `node_specs[]`
   - `edge_specs[]`
   - `supported_patch_ops[]`
   - `validation_issues[]`
   - `conflict_state`
   - `compiled_ir_preview`
   - `backlink_artifacts[]`
4. `role_lane_status_fields`
   - `role_id`
   - `execution_id`
   - `session_id`
   - `current_stage_id`
   - `status`
   - `latest_event_type`
   - `updated_at`
   - `pending_hitl`
   - `artifact_backlinks[]`
   - `review_backlinks[]`
5. `session_continuity_fields`
   - `session_id`
   - `session_status`
   - `current_route_id`
   - `latest_turn_id`
   - `latest_event_sequence`
   - `next_cursor`
   - `resume_selector`
   - `degraded_reason`
6. `hitl_decision_packet_fields`
   - `execution_id`
   - `task_id`
   - `review_id`
   - `risk_facts[]`
   - `policy_action`
   - `sla_deadline_at`
   - `default_timeout_action`
   - `allowed_decisions[]`
   - `impact_summary`
   - `backlinks[]`
7. `risk_contract_refs`
   - `risk-facts-and-hitl-sla-contract.md`

## 4. Required Constraints

1. `local_orchestration_service` 继续是 workflow / execution / HITL / governance projection 的唯一 truth owner；direct-workbench panel 不得直接读写 `.repo-ai-governor/**` canonical surfaces。
2. 所有 workflow draft mutation 都必须携带 `draft_revision` 或等价 base token；service 必须返回新的 revision、validation delta 与 `conflict_state`，防止 webview / tree / chat 多入口并发时出现 extension-local shadow state。
3. `workflow_draft_session` 只允许表示 schema-first authoring 会话；graph 是 projection，不是 canonical source，插件不得直接持久化 definition 文件。
4. `role_lane_status / execution_graph / execution_stage_progress / task_execution_backlinks / session_continuity` 必须全部来自 service-owned projection；consumer 不得拼装第二套 runtime state machine。
5. `hitl_decision_packet` 必须完整保留 `risk-facts-and-hitl-sla-contract.md` v1 的 `risk_id / risk_category / risk_level / evidence / change_scope / confidence / trigger_rule` 语义，并与 `policy_action / sla_deadline_at / default_timeout_action` 一起可回放。
6. `submitHitlDecision / recoverExecution / terminateExecution` 继续服从既有 `allow / confirm / block / escalate` 风险闸口；consumer 不得通过 richer cockpit 绕过 trust/policy gate。
7. `queryTaskExecutionBacklinks` 与 `backlinks[]` 必须显式回链 task card、review artifact、audit event 或等价 canonical governance surface，而不是只返回 presenter-only summary。
8. workflow/runtime/HITL 仍允许短期兼容 bridge，但 bridge 只能是 temporary path，且必须具备以下退出条件：
   - workflow authoring 不再依赖 CLI result text 渲染
   - runtime lane 状态不再通过 CLI summary 转述
   - HITL decision packet 不再依赖兼容命令补解释

## 5. Consumers

1. `runtime.governance-clients`
2. `apps/vscode-extension`
3. `runtime.cli-interactive-shell`
4. `docs/help/playbook/discoverability`

## 6. Compatibility

1. `v1` formalize 的是 direct-workbench follow-up 的 service seam，并不等于代码面已经交付所有 richer panel。
2. `v1` 明确接受 `schema-first authoring before richer graph editing` 的 phased rollout；freeform drag-drop 仍可作为后续增量，但不能先于 draft-session owner split。
3. `v1` 不自动提升 public support truth；direct graph authoring、runtime lanes 与 decision cockpit 的公开 claim 仍受后续 evidence window 约束。
