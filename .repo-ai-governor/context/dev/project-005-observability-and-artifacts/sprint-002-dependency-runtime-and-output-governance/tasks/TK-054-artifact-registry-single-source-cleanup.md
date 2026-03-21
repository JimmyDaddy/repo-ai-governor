# TK-054 Artifact Registry 单一事实源与人类视图收敛

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

收敛 Artifact Registry 到 `context/artifact-registry/*.csv` 单一事实源，并保留非重复的人类可读访问入口。

## 2. Depends On

1. `TK-048`
2. `TK-049`
3. `DA-059`
4. `DA-060`
5. `DA-061`

## 3. 预期产物

1. `.repo-ai-governor/context/dev/dependency-artifact-registry.md` guide-only 文档。
2. `.repo-ai-governor/context/dev/index.md` 收敛后的 artifact retrieval 入口。
3. `scripts/governance/render-artifact-registry-view.js` 人类视图渲染脚本。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-048-artifact-registry-and-dependency-resolver-runtime-baseline.md` (`DA-059`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-060`)
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-002-dependency-runtime-and-output-governance-input-constraints-checklist.md` (`DA-061`)
4. `.repo-ai-governor/normative_knowledge_sources/governance/artifact-registry-lifecycle-governance.md`
5. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
6. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`

## 5. 实施计划

1. 将 `dependency-artifact-registry.md` 从手工维护的 registry 镜像降级为 guide-only 文档。
2. 精简 `context/dev/index.md` 中重复维护的 artifact 列表，统一指向 canonical CSV 与 guide。
3. 新增基于 CSV/Archive CSV 的人类视图渲染脚本，避免继续维护 Markdown 表格镜像。
4. 通过任务台账、artifact lifecycle 与全量检查命令验证收敛结果。

## 6. 验证计划

1. `node ./scripts/governance/render-artifact-registry-view.js`
2. `pnpm run test:integration -- test/artifact-registry-view.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
7. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始收敛 artifact registry 的单一事实源与人类可读入口。
3. 2026-03-21：完成 `dependency-artifact-registry.md` guide-only 收敛、`context/dev/index.md` 去镜像、`artifacts:view` 渲染脚本与集成测试补齐。
4. 2026-03-21：执行 `reconcile-artifact-dependencies` 后完成 `DA-059~DA-061` 的依赖关系校准，并通过 `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-artifact-registry-lifecycle` 与 `pnpm run check`，任务切换为 `completed`。

## 8. 产出

1. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
2. `.repo-ai-governor/context/dev/index.md`
3. `scripts/governance/render-artifact-registry-view.js`
4. `test/artifact-registry-view.integration.test.ts`
