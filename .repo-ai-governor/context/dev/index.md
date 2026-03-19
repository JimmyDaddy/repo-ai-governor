# Dev Context Index

- Status: active
- Date: 2026-03-19
- Scope: `.repo-ai-governor/context/dev/**`

## 1. Core Navigation

1. `projects-overview`: `.repo-ai-governor/context/dev/projects-overview.md`
2. `dependency-artifact-registry`: `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
3. `primary project plan`: `.repo-ai-governor/context/dev/project-001-foundation/plan.md`

## 2. Artifact Retrieval Entry

1. Human-readable registry: `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
2. Machine-readable registry: `.repo-ai-governor/context/artifact-registry/artifacts.csv`
3. Active dependency artifacts:
   - `DA-002` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-002-artifact-registry-baseline.md`
   - `DA-003` `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md`
   - `DA-004` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-004-monorepo-boundary-and-ci-baseline.md`
   - `DA-005` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-config-contract-baseline.md`
   - `DA-006` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-i18n-community-solution-comparison-and-repo-decision.md`
   - `DA-007` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-cli-skeleton-baseline.md`
   - `DA-008` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md`
   - `DA-009` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-command-smoke-checklist.md`
   - `DA-010` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md`
   - `DA-011` `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-whitelist-and-regression-policy.md`

## 3. Consumption Rule

1. 任务卡中的 `Depends On` 与 `Input References` 应优先引用 `DA-xxx`。
2. 若产物会被 2 个及以上后续任务依赖，必须先登记到 artifact registry 再进入后续拆解。
3. 仅“规范/基线/约束”类产物进入 registry；`plan/checklist/tasks.csv/current-context` 等编排文档不登记为 `DA-*`。
