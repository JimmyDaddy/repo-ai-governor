# Normative Loading Manifest Lifecycle Governance

- Status: active
- Date: 2026-04-11
- Scope: `normative-loading-manifest / archive-sidecar / deprecated-compaction`
- Owner: governance

## 1. Purpose

1. 为 root `normative-loading-manifest.yaml` 提供可执行的生命周期出清规则，避免 catalog 无限膨胀。
2. 固定 archive manifest sidecar 的职责边界，保证历史目录与默认启动面解耦。
3. 在不引入 active multi-manifest cutover 的前提下，为 `deprecated -> archived` compaction 建立同窗口治理基线。

## 2. Canonical Truth Surfaces

1. root manifest：`.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
   - 继续是唯一 bootstrap truth。
   - 继续承担 default startup baseline 与 active/frozen/deprecated catalog 注册职责。
2. archive manifest：`.repo-ai-governor/normative_knowledge_sources/archive/normative-loading-manifest.archive.yaml`
   - 只承载 `archived` catalog sidecar。
   - 不进入默认启动加载面，不承担新的 startup truth 角色。
3. lifecycle governance doc：当前文档。
   - 负责定义 lifecycle 规则、同窗口变更要求、运维入口与 rollback 约束。

## 3. Archive Manifest Schema Baseline

1. archive manifest 顶层字段固定为：
   - `schema_version`
   - `generated_at`
   - `status`
   - `owner`
   - `root_manifest_path`
   - `archive_role`
   - `documents`
2. `documents[]` entry 复用 root manifest 的 document schema：
   - `doc_id`
   - `path`
   - `tier`
   - `status`
   - `default_load`
   - `load_trigger`
   - `owner`
   - `last_reviewed_at`
   - `notes`
3. archive manifest 只允许出现 `status=archived` 的 entries。

## 4. Lifecycle Rules

1. `active` 与 `frozen` 继续留在 root manifest。
2. `deprecated` 继续留在 root manifest，但必须满足：
   - `default_load=false`
   - 明确记录 `deprecated_at`
   - 默认宽限阈值为 `14` 天
3. `archived` 不允许长期停留在 root manifest；一旦归档，目标值固定为 root manifest `0` entry。
4. root manifest 与 archive manifest 之间不得出现重复 `doc_id` 或 `path`。
5. `.repo-ai-governor/draft/**` 继续禁止进入 root/archive manifest。

## 5. Same-Window Mutation Contract

1. archive split 与 `deprecated -> archived` 迁移必须在同一 change window 同步更新：
   - root manifest
   - archive manifest
   - 当前治理文档（当规则发生变化时）
2. 不允许只更新 archive manifest 而跳过 root manifest write-back。
3. 不允许在当前批准范围内引入：
   - `manifest_refs`
   - active shard manifests
   - merged active catalog parser
   - sqlite canonical truth cutover

## 6. Planned Operational Entry Points

1. archive integrity gate 的实现目标入口固定为：
   - `node ./scripts/governance/check-normative-loading-manifest-archive.js`
2. deprecated compaction 的实现目标入口固定为：
   - `node ./scripts/governance/compact-normative-loading-manifest.js`
3. 上述命令的落地责任属于 `project-079 / sprint-002`；当前 sprint-001 只冻结 contract，不宣称这些入口已在仓库中可执行。
4. `dry-run` 是 compaction 默认建议模式；真正 write-back 只在显式关闭 dry-run 后执行。
5. monthly audit 必须覆盖：
   - root manifest 是否残留 archived entries
   - archive manifest status purity
   - root/archive 是否出现 `doc_id/path` 重叠
   - 是否存在超期 `deprecated` backlog

## 7. Rollback

1. rollback 语义保持简单：把目标 entry 从 archive manifest 回写 root manifest 即可。
2. rollback 不改变 root manifest schema，也不引入新的 bootstrap indirection。
3. 若 rollback 发生在同一窗口内，必须同步刷新 `generated_at` 并保留原因记录。

## 8. Audit Notes

1. 当前批准窗口只收口 `archive split + deprecated compact + bootstrap truth preservation`。
2. 若 archive split 与 deprecated compact 完成后 root manifest 仍持续增长，active sharding 只能通过新的 technical solution 重新评审。
