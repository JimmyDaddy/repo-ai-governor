# Normative Loading Lifecycle Contract

- Status: active
- Date: 2026-04-11
- Contract ID: `contract.governance.normative-loading.lifecycle.v1`
- Producer Module: `governance.normative-loading`

## 1. 目标

定义 root normative loading manifest 的生命周期出清、archive split、deprecated compact 与 bootstrap truth preservation 契约，使后续治理实现可以在不引入 active multi-manifest cutover 的前提下完成 root manifest 收缩。

## 2. Canonical Truth Surfaces

1. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml` 继续是唯一 bootstrap truth。
2. archive manifest 只允许作为 `archived` catalog sidecar，不是新的 startup truth。
3. formal module docs 负责治理契约，不直接替代 root manifest 的 active document registration 职责。

## 3. Lifecycle State Rules

1. `active`、`frozen` 可保留在 root manifest active catalog。
2. `deprecated` 不允许 `default_load=true`，且必须带受控宽限窗口。
3. `archived` 不应长期停留在 root manifest；迁出后只保留在 archive manifest。
4. `draft` 路径不得进入 manifest。

## 4. Archive Split Constraints

1. root manifest 中不得长期保留 `archived` entries。
2. archive manifest 只允许包含 `status=archived` 条目。
3. root manifest 与 archive manifest 之间不得出现重复 `doc_id` 或 `path`。
4. `v1` 不引入 `manifest_refs`、merged active catalog 或 multi-active-truth parser cutover。

## 5. Deprecated Compaction Constraints

1. `deprecated_days=14` 是当前 formal default。
2. `deprecated -> archived` 迁移必须在同一 change window 同步更新 root manifest 与 archive manifest。
3. compact 命令必须支持 `dry-run`，monthly audit 必须能发现超期 `deprecated` backlog。
4. 若 root manifest 在 archive split + deprecated compact 后仍持续膨胀，active sharding 只能通过独立 follow-up technical solution 重新评审。

## 6. Compatibility And Rollback

1. root manifest schema 在 `v1` 内必须保持与现有单文件 parser/gate 兼容。
2. rollback 语义保持简单：如需回滚，只需把目标 entry 从 archive manifest 回写 root manifest。
3. sqlite projection、active sharding、merged compatibility view 均不属于当前 contract scope。
