# Dev Context Index

- Status: active
- Date: 2026-04-02
- Scope: `.repo-ai-governor/context/dev/**`

## 1. Core Navigation

1. `projects-overview`: `.repo-ai-governor/context/dev/projects-overview.md`
2. `dependency-artifact-registry-guide`: `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
3. `primary project plan`: `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/plan.md`
4. `latest completed project plan`: `.repo-ai-governor/context/dev/project-018-technical-solution-promotion-pilots/plan.md`

## 2. Artifact Retrieval Entry

1. Registry guide: `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
2. Canonical sqlite registry: `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
3. Rendered main view: `.repo-ai-governor/context/artifact-registry/artifacts.csv`
4. Rendered archive view: `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
5. Human-readable render command: `pnpm run artifacts:view`
6. Quick lookup examples:
   - active rendered row: `rg '^DA-059,' .repo-ai-governor/context/artifact-registry/artifacts.csv`
   - archived rendered row: `rg '^DA-002,' .repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`

## 3. Consumption Rule

1. 任务卡中的 `Depends On` 与 `Required Inputs` 应优先引用 `DA-xxx`；`Traceback References` 仅保留追溯所需输入。
2. 若产物会被 2 个及以上后续任务依赖，必须先登记到 artifact registry 再进入后续拆解。
3. 仅“规范/基线/约束”类产物进入 registry；`plan/checklist/tasks.csv/current-context` 等编排文档不登记为 `DA-*`。
4. `context/dev` 下不再维护 artifact registry 全量镜像，避免与 canonical sqlite / rendered CSV view 漂移。
