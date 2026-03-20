# Dev Context Index

- Status: active
- Date: 2026-03-20
- Scope: `.repo-ai-governor/context/dev/**`

## 1. Core Navigation

1. `projects-overview`: `.repo-ai-governor/context/dev/projects-overview.md`
2. `dependency-artifact-registry`: `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
3. `primary project plan`: `.repo-ai-governor/context/dev/project-002-governance-core/plan.md`

## 2. Artifact Retrieval Entry

1. Human-readable registry: `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
2. Machine-readable registry: `.repo-ai-governor/context/artifact-registry/artifacts.csv`
3. Archive registry: `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
4. Active dependency artifacts:
   - `DA-003` `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md`
   - `DA-009` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-command-smoke-checklist.md`
   - `DA-010` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md`
   - `DA-011` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-whitelist-and-regression-policy.md`
   - `DA-012` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-001-exit-acceptance-baseline.md`
   - `DA-013` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md`
   - `DA-014` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-009-workspace-resolver-dual-mode-baseline.md`
   - `DA-015` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-010-workspace-migration-chain-baseline.md`
   - `DA-016` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-schema-diff-baseline.md`
   - `DA-017` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-human-confirmation-policy-baseline.md`
   - `DA-018` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-sprint-002-exit-acceptance-and-rollback-baseline.md`
   - `DA-019` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-stage-2-input-readiness-checklist.md`
   - `DA-020` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md`
   - `DA-021` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-014-runtime-control-flow-engine-baseline.md`
   - `DA-022` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-015-memory-session-store-baseline.md`
   - `DA-023` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-022-sqlite-fs-memory-provider-baseline.md`
   - `DA-024` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-023-memory-store-engine-config-and-cli-composition-baseline.md`
   - `DA-025` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-001-governance-core-exit-acceptance-baseline.md`
   - `DA-026` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-002-input-constraints-checklist.md`
   - `DA-027` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-017-change-risk-evaluator-baseline.md`
   - `DA-028` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-018-policy-gate-engine-baseline.md`

## 3. Consumption Rule

1. 任务卡中的 `Depends On` 与 `Input References` 应优先引用 `DA-xxx`。
2. 若产物会被 2 个及以上后续任务依赖，必须先登记到 artifact registry 再进入后续拆解。
3. 仅“规范/基线/约束”类产物进入 registry；`plan/checklist/tasks.csv/current-context` 等编排文档不登记为 `DA-*`。
