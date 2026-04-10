# Session Main Capability Interaction Model Contract

- Status: active
- Date: 2026-04-10
- Contract ID: `contract.runtime.session-main.capability-interaction-model.v1`
- Producer Module: `runtime.orchestration`

## 1. 目标

定义 `session.main` 公开能力在 `raw role entry / AI fixed workflow / deterministic utility / pending existence review / explain only` 之间的正式交互分层，避免 capability catalog、routing、slash discoverability 与帮助文案继续各自维护不同心智。

## 2. Minimum Fields

1. `capability_id`
2. `interaction_model`
3. `primary_entry`
4. `backing_execution`
5. `related_capability_ids[]`
6. `deterministic_action_name`
7. `role_alias_target`
8. `legacy_command_alias`

## 3. Allowed Values

1. `interaction_model`
   - `raw_role_entry`
   - `ai_fixed_workflow`
   - `deterministic_utility`
   - `pending_existence_review`
   - `explain_only`
2. `primary_entry`
   - `role_mention`
   - `slash_command`
   - `cli_command`
   - `conversational_answer`
3. `backing_execution`
   - `raw_role_delegate`
   - `templated_ai_workflow`
   - `pure_command`
   - `undecided`

## 4. Required Constraints

1. `runtime.orchestration` 是这份 interaction model 的唯一 producer；`runtime.cli-interactive-shell` 只能消费，不得反向拥有第二份 command-model truth。
2. `raw_role_entry` 只用于 expert surface，例如 `@planner / @architect / @reviewer / @verifier`；role mention 不是 slash bridge，也不应取代标准任务的主入口。
3. `ai_fixed_workflow` 适用于产品化 AI 工作流；当前正式范围至少包括：
   - `plan`
   - `review`
   - `review_verify`
4. `deterministic_utility` 适用于作用域固定、产物固定或状态机固定的命令；当前正式范围至少包括：
   - `plan_sync`
   - `workflow`
   - `connect`
   - `doctor`
   - `workspace.switch_branch`
5. `pending_existence_review` 只用于已公开但必须先补齐公开价值证明的命令；当前正式范围只允许 `run`。
6. `run` 在 `pending_existence_review` 状态下仍可保留 public surface，但 generic implementation ask 不得再被默认桥接到 `/run`；最终 public wording 必须收窄到 “reusable governed workflow / task-driven execution flow”。
7. `verify` 不得继续作为 public capability/cmd 出现在 governed capability catalog、session-shell slash discoverability 或 public CLI appendix 中；相关 readiness checks 必须转由 `connect` follow-up、`doctor` mode 或 internal gate 承接。
8. 删除 public `/verify` 不得删除 `runtime.agent-projection` 的 onboarding contract、binding truth 或 `AgentDescriptor` projection seam。
9. 如果 presenter 需要统一展示 governed capabilities 与 shell-local builtins，只能在组合层合并，不得把 `/confirm`、`/cancel`、`/clear`、`/exit`、`/resume`、`/history`、`/search`、`/multiline`、`/status`、`/theme`、`/agent` 等 CLI-only builtins 重新注册为 orchestration-owned capability。

## 5. Canonical Mapping Baseline

| capability | interaction_model | primary_entry | backing_execution |
|---|---|---|---|
| `@planner` | `raw_role_entry` | `role_mention` | `raw_role_delegate` |
| `@architect` | `raw_role_entry` | `role_mention` | `raw_role_delegate` |
| `@reviewer` | `raw_role_entry` | `role_mention` | `raw_role_delegate` |
| `@verifier` | `raw_role_entry` | `role_mention` | `raw_role_delegate` |
| `plan` | `ai_fixed_workflow` | `slash_command` | `templated_ai_workflow` |
| `review` | `ai_fixed_workflow` | `slash_command` | `templated_ai_workflow` |
| `review_verify` | `ai_fixed_workflow` | `slash_command` | `templated_ai_workflow` |
| `plan_sync` | `deterministic_utility` | `slash_command` | `pure_command` |
| `workflow` | `deterministic_utility` | `slash_command` | `pure_command` |
| `connect` | `deterministic_utility` | `slash_command` | `pure_command` |
| `doctor` | `deterministic_utility` | `slash_command` | `pure_command` |
| `workspace.switch_branch` | `deterministic_utility` | `slash_command` | `pure_command` |
| `run` | `pending_existence_review` | `slash_command` | `pure_command` |
| `help` | `explain_only` | `conversational_answer` | `pure_command` |

## 6. Consumers

1. `runtime.cli-interactive-shell`
2. `packages/core-orchestration-service`
3. `apps/cli`
4. `docs/help/playbook/discoverability`

## 7. Compatibility

1. `v1` 定义的是 interaction model truth，不等于所有对应 runtime/CLI 行为已经在代码面一次性全部交付。
2. `v1` 允许 `run` 先以 `pending_existence_review` 进入正式 contract，再由后续 rollout 把 public wording 收窄到稳定终态。
3. `v1` 明确 public `/verify` removal，但不否定 adapter readiness、binding verification 或 durable-storage preflight 这类底层检查能力继续存在。
