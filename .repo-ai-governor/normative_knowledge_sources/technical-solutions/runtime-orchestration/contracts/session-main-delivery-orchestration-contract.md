# Session Main Delivery Orchestration Contract

- Status: active
- Date: 2026-04-16
- Contract ID: `contract.runtime.session-main.delivery-orchestration.v1`
- Producer Module: `runtime.orchestration`

## 1. 目标

定义 `session.main` 作为 requirement-to-CR governed delivery owner 时的最小 orchestration contract，确保 `deliver` capability、phase machine、approved durable brief 与 child workflow backlink 在同一条正式 runtime truth 中收口。

## 2. Minimum Fields

1. `workflow_id`
2. `capability_id`
3. `current_phase`
4. `approved_delivery_brief_path`
5. `pending_action`
6. `selected_target_stream`
7. `related_artifact_paths[]`
8. `child_workflow_backlinks[]`
9. `blocked_reason`
10. `result_summary`

## 3. Allowed Values

1. `capability_id`
   - `deliver`
2. `current_phase`
   - `requirement_capture`
   - `requirement_review_pending`
   - `solution_drafting`
   - `solution_review_pending`
   - `task_decomposition_preview`
   - `task_plan_commit_pending`
   - `execution_active`
   - `review_pending`
   - `review_verify_pending`
   - `resolved`
   - `blocked`

## 4. Required Constraints

1. `deliver` 必须保持 `ai_fixed_workflow` parent capability 身份；不得被降格为 raw role entry，也不得冒充 deterministic utility。
2. `approved_delivery_brief_path` 只有在 requirement review 已通过 `explicit approval` 或 docs-only `review` 后才允许写入 durable surface。
3. `solution_drafting` 之后的 phase 只能回链既有 authoritative truth：
   - `technical-solution-review` artifact 与 lifecycle registry
   - plan preview/commit contract 与 sprint ledger
   - canonical review artifact 与 `CR-xxx`
4. `child_workflow_backlinks[]` 只能引用既有 `plan / review / review_verify / run` 等 child workflow 的 artifact 或 execution truth；`deliver` 不得复制第二套 artifact body。
5. `/deliver` 若被 presenter 暴露，只能作为 discoverability alias；`conversational_answer` 仍是 canonical primary entry。
6. `blocked` 与 `resolved` 只表示 delivery workflow overlay summary，不得替代底层 task/review lifecycle 的终态字段。

## 5. Consumers

1. `runtime.durable-storage`
2. `runtime.cli-interactive-shell`
3. `packages/core-orchestration-service`

## 6. Compatibility

1. `v1` formalize 的是 orchestration truth，不等于所有 child workflow 已在代码面完全交付。
2. `v1` 允许 requirement capture 先停留在 shared-session preview，再按批准边界导出 approved durable brief。
3. `v1` 不引入新的 requirement lifecycle registry、solution lifecycle registry 或 review lifecycle registry。
