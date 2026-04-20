# Session Shell Delivery Workflow Presenter Contract

- Status: active
- Date: 2026-04-16
- Contract ID: `contract.cli.session-shell.delivery-workflow-presenter.v1`
- Producer Module: `runtime.cli-interactive-shell`

## 1. 目标

定义 session shell 如何消费 `deliver` workflow 的 phase summary、pending action 与 artifact backlink，使 requirement-to-CR 主路径可以被稳定呈现，而不让 CLI presenter 重新拥有 workflow truth。

## 2. Minimum Fields

1. `turn_delivery_phase`
2. `turn_delivery_pending_action`
3. `turn_delivery_related_artifact_paths[]`
4. `turn_delivery_selected_stream`
5. `turn_delivery_result_summary`

## 3. Required Constraints

1. `turn_delivery_phase`、`turn_delivery_pending_action` 与 `turn_delivery_related_artifact_paths[]` 必须来自 shared session truth 或 durable projection；CLI 不得本地推导。
2. 当 phase 为 `requirement_review_pending`、`solution_review_pending`、`task_plan_commit_pending` 或 `review_verify_pending` 时，shell 只能渲染等待用户处理的摘要与 artifact backlink，不得直接宣称对应底层 workflow 已通过。
3. `/deliver` 若存在，只能作为 discoverability alias；shell 不得把 alias 路径写成与自然语言入口并列的第二套 pending handoff truth。
4. presenter 可以把 approved durable brief、solution review artifact、task plan 与 review artifact 渲染成可回看 backlink，但不得把原始 machine payload 直接塞进 transcript 主文。

## 4. Consumers

1. `entry.cli`
2. `integrations.desktop`

## 5. Compatibility

1. `v1` 是 `contract.cli.session-shell.v1` 的补充 presenter contract，不替代 session-shell 基础字段集合。
2. `v1` 允许先通过 transcript summary / command recap 呈现 delivery workflow，再在后续 rollout 中扩展 richer affordance。
