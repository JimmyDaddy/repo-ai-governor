# Dependency Artifact Registry

- Status: active
- Date: 2026-03-20
- Scope: `.repo-ai-governor/context/dev/**`
- Lifecycle Governance: `.repo-ai-governor/normative_knowledge_sources/governance/artifact-registry-lifecycle-governance.md`

## Purpose

统一登记“会被后续任务依赖的产物”，确保产物创建后可被后续任务立即检索、回链与消费。

## Registration Rules

1. 仅登记“规范/基线/约束”类产物（例如 strategy、baseline、contract、constraint、policy、acceptance checklist 等）。
2. 编排类过程文档默认不登记（例如 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`current-context.md`、普通进度记录）。
3. 任何被 2 个及以上后续任务依赖的合格产物，必须在本表登记。
4. 产物登记后，必须同步：
   - `.repo-ai-governor/context/dev/index.md` 的可检索入口；
   - 相关任务卡的 `Depends On` 与 `Input References`；
   - 触发任务的 `tasks/checklist.md` 与 `tasks/tasks.csv` 执行记录。
5. 若依赖任务新增或变更，需在同一变更窗口更新本表。
6. `dependent_tasks` 不允许使用 `TBD` 占位；未分配依赖任务时保持为空并在任务落盘后显式回填。
7. `artifact_status` 必须遵循生命周期：`active/frozen/deprecated/archived/retired`。
8. 主注册表仅保留 `active/frozen/deprecated`；`archived/retired` 必须迁移到归档注册表。

## Registry Table

| artifact_id | artifact_path | producer_task | dependent_tasks | first_registered_at | last_updated_at | status |
|---|---|---|---|---|---|---|
| DA-003 | `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` | `TK-003` | *(none)* | 2026-03-19 | 2026-03-20 | active |
| DA-009 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-command-smoke-checklist.md` | `TK-006` | *(none)* | 2026-03-19 | 2026-03-20 | active |
| DA-010 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md` | `TK-007` | *(none)* | 2026-03-19 | 2026-03-20 | active |
| DA-011 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-whitelist-and-regression-policy.md` | `TK-007` | *(none)* | 2026-03-19 | 2026-03-20 | active |
| DA-012 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-001-exit-acceptance-baseline.md` | `TK-008` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-013 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md` | `TK-008` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-014 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-009-workspace-resolver-dual-mode-baseline.md` | `TK-009` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-015 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-010-workspace-migration-chain-baseline.md` | `TK-010` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-016 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-schema-diff-baseline.md` | `TK-011` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-017 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-human-confirmation-policy-baseline.md` | `TK-011` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-018 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-sprint-002-exit-acceptance-and-rollback-baseline.md` | `TK-012` | *(none)* | 2026-03-20 | 2026-03-20 | active |
| DA-019 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-stage-2-input-readiness-checklist.md` | `TK-012` | *(none)* | 2026-03-20 | 2026-03-20 | active |

## Archive Registry Table

| artifact_id | artifact_path | producer_task | dependent_tasks | first_registered_at | last_updated_at | status |
|---|---|---|---|---|---|---|
| DA-002 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-002-artifact-registry-baseline.md` | `TK-002` | *(none)* | 2026-03-19 | 2026-03-20 | archived |
| DA-004 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md` | `TK-004` | *(none)* | 2026-03-19 | 2026-03-20 | archived |
| DA-005 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-config-contract-baseline.md` | `TK-005` | *(none)* | 2026-03-19 | 2026-03-20 | archived |
| DA-006 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-i18n-community-solution-comparison-and-repo-decision.md` | `TK-005` | *(none)* | 2026-03-19 | 2026-03-20 | archived |
| DA-007 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-cli-skeleton-baseline.md` | `TK-006` | *(none)* | 2026-03-19 | 2026-03-20 | archived |
| DA-008 | `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md` | `TK-006` | *(none)* | 2026-03-19 | 2026-03-20 | archived |

## Notes

1. `dependent_tasks` 字段使用任务 ID 列表，按时间先后排序。
2. 如产物废弃或被替代，先转 `deprecated`，再迁移到 archive 并标记 `archived/retired`，避免静默删除造成链路中断。
3. 后续任务消费产物时，优先引用 `artifact_id + artifact_path` 双键，避免仅凭文件名检索。
4. 若产物不满足“规范/基线/约束”属性，即使被引用也不登记为 DA。
5. 关闭状态任务（如 `completed`）不得继续保留在 `dependent_tasks`；可通过 `node ./scripts/governance/reconcile-artifact-dependencies.js` 清理。
