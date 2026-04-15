# Dependency Artifact Registry Guide

- Status: active
- Date: 2026-04-02
- Scope: `.repo-ai-governor/context/dev/**`
- Canonical Registry:
  - `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
- Rendered Compatibility Views:
  - `.repo-ai-governor/context/artifact-registry/artifacts.csv`
  - `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
- Human-readable Render:
  - `pnpm run artifacts:view`
- Lifecycle Governance: `.repo-ai-governor/normative_knowledge_sources/governance/artifact-registry-lifecycle-governance.md`

## Purpose

本文件不再保存手工维护的 registry 行数据，而是作为 artifact registry 的使用说明与检索入口。

这样做的原因只有一个：避免 `Markdown 表格镜像` 与 `rendered CSV view` 双写后产生状态漂移。

## Single Source Of Truth

1. `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite` 是 artifact registry / archive registry 的 machine-readable canonical truth。
2. `.repo-ai-governor/context/artifact-registry/artifacts.csv` 与 `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv` 是从 canonical sqlite 渲染出的 compatibility/export view。
3. 本文件只保留规则、命令与检索方式，不再记录 artifact 行。
4. 任何人类可读视图都应从 canonical sqlite 动态渲染，而不是在 Markdown 中重复维护。

## Registration Rules

1. 仅登记“规范/基线/约束”类产物，例如 `strategy`、`baseline`、`contract`、`constraint`、`policy`、`acceptance checklist`。
2. 编排类过程文档默认不登记，例如 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`current-context.md`、普通进度记录。
3. 任何被 2 个及以上后续任务依赖的合格产物，必须进入 artifact registry。
4. `artifact_status` 必须遵循生命周期：`active/frozen/deprecated/archived/retired`。
5. rendered 主视图仅保留 `active/frozen/deprecated`；`archived/retired` 必须迁移到 rendered 归档视图。

## Retrieval

1. 查看人类可读视图：
   - `pnpm run artifacts:view`
2. 查询 rendered 主视图中的单条记录：
   - `rg '^DA-059,' .repo-ai-governor/context/artifact-registry/artifacts.csv`
3. 查询 rendered 归档视图中的单条记录：
   - `rg '^DA-002,' .repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
4. 后续任务消费产物时，优先引用 `artifact_id + artifact_path` 双键，避免只靠文件名检索。
5. 若 CSV 视图与 sqlite canonical truth 可能漂移，先执行 `node ./scripts/governance/render-artifact-registry-view.js` 重新渲染，再进行人工检查。
6. 当 task decomposition 需要为新任务挑选候选 DA 时，优先运行：
   - `node ./scripts/governance/query-artifact-candidates.js --project <project-xxx> --task-title "<title>" --goal "<goal>" --limit 5`
7. decomposition 阶段只建议把首跳正式 DA 输入放进 `Required Inputs`；其他历史/补充材料移到 `Traceback References`，避免默认上下文爆炸。

## Sync Requirements

1. 产物登记后，仍需同步相关任务卡的 `Depends On`、`Required Inputs` 与 `Traceback References`。
2. 依赖任务变更后，执行 `node ./scripts/governance/reconcile-artifact-dependencies.js` 回填 `dependent_tasks`。
3. 生命周期与归档清理遵循 `node ./scripts/governance/check-artifact-registry-lifecycle.js` 与 `node ./scripts/governance/compact-artifact-registry.js`。
4. `.repo-ai-governor/context/dev/index.md` 只保留检索入口，不再镜像完整 artifact 列表。

## Notes

1. 历史任务、review 与审计文档中仍可能引用本文件路径；这些引用保持有效，但它们现在指向的是 guide，而不是 registry 镜像。
2. 如果未来需要新的人类视图形态，优先扩展渲染脚本或 CLI 输出，不要恢复手工维护表格。
