# Technical Solution Lifecycle Registry Contract

- Status: active
- Date: 2026-03-26
- Contract ID: `contract.technical-solution.lifecycle-registry.v1`
- Producer Module: `governance.technical-solution-registry`

## 1. 目标

定义技术方案 `draft -> review_pending -> approved -> active -> superseded/archived` 生命周期的结构化事实源，确保草稿态不误入默认加载面，正式态 promotion 时又能和 manifest、module registry、review 证据保持一致。

## 2. Minimum Fields

1. `solution_id`
2. `title`
3. `status`
4. `owner`
5. `version`
6. `scope`
7. `draft_paths[]`
8. `review_paths[]`
9. `final_paths[]`
10. `target_module_ids[]`
11. `north_star_refs[]`
12. `approved_at`
13. `approved_by`
14. `activated_at`
15. `supersedes[]`

## 3. Required Constraints

1. `draft_paths[]` 只能指向 `.repo-ai-governor/draft/**`，且不得进入 manifest 的 active load surface。
2. `active/superseded` 条目的 `final_paths[]` 必须存在且已登记到 `normative-loading-manifest.yaml`（含 `external_required_inputs`）。
3. `target_module_ids[]` 若非空，必须能解析到 `technical-solution-module-registry.yaml` 中的真实模块。
4. `review_pending/approved/active/superseded` 至少要有一条 review 证据路径。
5. `approved/active/superseded` 必须同时声明 `approved_at` 与 `approved_by`。

## 4. Promotion Policy

1. `draft` 资产只允许作为讨论输入或 traceback，不进入默认规范加载面。
2. promotion 发生时，至少要同步：
   - lifecycle registry
   - technical-solution-delivery-registry.yaml
   - `normative-loading-manifest.yaml`
   - `technical-solution-module-registry.yaml`（若命中模块事实面）
   - 对应 review / artifact / task ledger
3. `approved` 不等于 `active`；只有完成 final docs 接线和 gate 对齐后，才能切换为 `active`。
4. `active` technical solution 必须拥有 delivery handoff ownership；否则 promotion 视为未真正收口。

## 5. Compatibility

1. `v1` 不要求自动执行 promotion 命令，只要求 lifecycle registry 与 gate 能阻断错误状态。
2. `v1` 允许历史 draft 以 `archived` 方式保留在 `.repo-ai-governor/draft/**` 中作为 traceback/background。
