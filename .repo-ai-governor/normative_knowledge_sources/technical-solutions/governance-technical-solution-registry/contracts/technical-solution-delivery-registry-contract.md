# Technical Solution Delivery Registry Contract

- Status: active
- Date: 2026-03-27
- Contract ID: `contract.technical-solution.delivery-registry.v1`
- Producer Module: `governance.technical-solution-registry`

## 1. 目标

定义技术方案从 `active formal docs` 进入真实执行流的结构化 handoff 事实源，确保“方案正式化完成”不会停留在文档面，而是能明确映射到 `docs_only`、既有执行流，或新的 follow-up project/sprint/task。

## 2. Minimum Fields

1. `solution_id`
2. `delivery_mode`
3. `consumer_surfaces[]`
4. `user_impact_level`
5. `execution_status`
6. `rollout_status`
7. `owner`
8. `project_ref`
9. `sprint_ref`
10. `task_ids[]`
11. `project_plan_path`
12. `sprint_plan_path`
13. `task_csv_path`
14. `handoff_artifact_path`
15. `rollout_artifacts[]`
16. `accepted_at`

## 3. Allowed Values

1. `delivery_mode`
   - `docs_only`
   - `existing_stream`
   - `followup_required`
2. `consumer_surfaces`
   - `internal_governance`
   - `adopter_cli`
   - `packaged_distribution`
   - `runtime_service`
   - `docs_playbook`
3. `user_impact_level`
   - `none`
   - `low`
   - `medium`
   - `high`
4. `execution_status`
   - `not_required`
   - `planned`
   - `in_progress`
   - `completed`
5. `rollout_status`
   - `not_required`
   - `planned`
   - `in_progress`
   - `completed`

## 4. Required Constraints

1. 每个 `active` technical solution 都必须拥有且仅拥有一条 delivery entry。
2. `docs_only` 只能使用 `execution_status=not_required`。
3. `existing_stream` 必须指向真实存在的 project/sprint/task 记录，且执行状态不得为 `not_required/planned`。
4. `followup_required` 必须指向真实存在的 project/sprint/task 记录，且执行状态只能为 `planned/in_progress/completed`。
5. `planned/in_progress` 的 `followup_required` entry 必须在 `current-context.md` 的 active 或 planned stream 面中可见。
6. `task_ids[]` 必须能解析到 `task_csv_path` 中同 project/sprint 的真实任务记录。
7. 每条 delivery entry 都必须声明至少一个 `consumer_surface`。
8. 命中 `adopter_cli`、`packaged_distribution`、`runtime_service` 或 `docs_playbook` 的 entry 必须显式声明 `rollout_status != not_required`。
9. `rollout_status != not_required` 时必须声明 `rollout_artifacts[]`；`rollout_status=not_required` 时不得声明 rollout artifacts。

## 5. Handoff Policy

1. promotion 只完成 formal docs，不代表实现已经开始。
2. 当 solution 从 `draft/review_pending/approved` 切到 `active` 时，必须同步声明它的 delivery ownership：
   - `docs_only`
   - `existing_stream`
   - `followup_required`
3. 若为 `followup_required`，则同一 change set 中至少要完成：
   - 新的 `project/sprint/task` skeleton；或
   - `current-context.md -> Planned Follow-Up Streams` 登记；或
   - 切换到新的 active stream
4. 对服务使用者产生影响的方案，不仅要完成 execution handoff，还要声明 rollout ownership。
5. 未完成 delivery handoff 的 promotion 不算真正收口。
