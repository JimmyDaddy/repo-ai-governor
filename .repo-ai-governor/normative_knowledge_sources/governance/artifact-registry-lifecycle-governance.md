# Artifact Registry Lifecycle Governance

- Status: active
- Date: 2026-03-20
- Scope: `.repo-ai-governor/context/artifact-registry/**`

## 1. Purpose

定义依赖产物注册表的生命周期退出机制，避免主上下文无限增长，保证任务检索只加载“仍可消费”的产物集合。

## 2. Lifecycle Status

1. `active`
   - 可被新任务依赖与消费。
2. `frozen`
   - 仅允许存量任务继续消费，不建议新增依赖。
3. `deprecated`
   - 已有替代或即将退出；禁止新增依赖；应在宽限窗口内转入归档。
4. `archived`
   - 已退出主注册表；仅保留审计查询能力。
5. `retired`
   - 历史保留记录；默认不再参与任何执行注入。

## 3. Registry Split

1. 主注册表：`.repo-ai-governor/context/artifact-registry/artifacts.csv`
   - 仅允许 `active/frozen/deprecated`。
2. 归档注册表：`.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
   - 仅允许 `archived/retired`。

## 4. Exit Rules

1. `active` 且 `dependent_tasks` 为空（或仅 `TBD`）达到闲置阈值后，必须转 `deprecated`。
2. `deprecated` 达到宽限期后，必须转 `archived` 并迁出主注册表。
3. `archived/retired` 不允许留在主注册表。
4. 依赖解析只允许消费 `active/frozen`；命中 `deprecated/archived/retired` 按策略触发 `warn/block`。

## 5. Gate And Operations

1. Gate:
   - `node ./scripts/governance/check-artifact-registry-lifecycle.js`
2. 运维命令：
   - `node ./scripts/governance/reconcile-artifact-dependencies.js`
   - `node ./scripts/governance/compact-artifact-registry.js`
   - `pnpm run artifacts:compact -- --dry-run`（统一 dry-run 编排）
3. 默认策略：
   - 先通过 warning/计划窗口完成历史清理，再将生命周期规则纳入 blocking gate。
4. 推荐执行顺序：
   - 先执行依赖清理（移除已关闭或缺失任务引用），再执行 compact 状态迁移。

## 6. Audit Requirements

1. 任一状态迁移必须更新 `artifact_status` 与 `last_updated_at`。
2. 主/归档注册表迁移必须在同一变更集提交。
3. 对已归档产物的再消费请求必须记录任务级理由并触发人工确认。
