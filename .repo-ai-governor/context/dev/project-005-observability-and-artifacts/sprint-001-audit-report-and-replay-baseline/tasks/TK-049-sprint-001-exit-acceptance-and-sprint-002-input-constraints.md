# TK-049 sprint-001 出口验收与 sprint-002 输入约束

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-001-audit-report-and-replay-baseline`

## 1. 任务目标

形成 sprint-001 验收基线并沉淀 sprint-002 输入约束清单。

## 2. Depends On

1. `TK-046`
2. `TK-047`
3. `TK-048`
4. `DA-057`
5. `DA-058`
6. `DA-059`

## 3. 预期产物

1. `DA-060` sprint-001 exit acceptance baseline 文档。
2. `DA-061` sprint-002 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-046-audit-recorder-event-model-and-minimum-fields-baseline.md` (`DA-057`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-047-report-builder-and-replay-explain-baseline.md` (`DA-058`)
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-048-artifact-registry-and-dependency-resolver-runtime-baseline.md` (`DA-059`)
4. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/plan.md`
5. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/plan.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§9.3`、`§11`）
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`、`§6`）
8. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`、`CS-024`）

## 5. sprint-001 出口验收基线

1. Audit Recorder 事件模型与最小字段契约
   - 验收结果：通过
   - 证据：`DA-057`、`verified_review_tk-046-audit-recorder-event-model-and-minimum-fields-baseline.md`
2. Report Builder 与 Replay/Explain 能力
   - 验收结果：通过
   - 证据：`DA-058`、`verified_review_tk-047-report-builder-and-replay-explain-baseline.md`
3. Artifact Registry + Dependency Resolver 运行时语义
   - 验收结果：通过
   - 证据：`DA-059`、`verified_review_tk-048-artifact-registry-and-dependency-resolver-runtime-baseline.md`
4. 依赖回填、台账一致性与生命周期门禁
   - 验收结果：通过
   - 证据：`node ./scripts/governance/reconcile-artifact-dependencies.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`、`pnpm run check`

## 6. sprint-002 输入约束总览

1. 已输出 `DA-061` 作为 `sprint-002-dependency-runtime-and-output-governance` 启动前统一输入约束清单。
2. `TK-050`、`TK-051`、`TK-052` 已在任务卡显式回链 `DA-060` 与/或 `DA-061`，确保 sprint-002 三条主能力链路消费入口一致。
3. 生命周期治理约束：后续任务仅消费 `active/frozen` 状态产物，`dependent_tasks` 由脚本自动回填，禁止手工漂移。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始汇总 TK-046/TK-047/TK-048 验收证据并整理 sprint-002 输入约束草案。
3. 2026-03-21：产出 `DA-061` 输入约束清单，并完成 `DA-060/DA-061` 在 artifact registry 与索引台账的登记。
4. 2026-03-21：完成门禁复核与台账同步，任务状态切换为 `completed`。

## 9. 产出

1. `DA-060` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `DA-061` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-002-dependency-runtime-and-output-governance-input-constraints-checklist.md`
3. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
4. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
5. `.repo-ai-governor/context/dev/index.md`
6. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/review/review_tk-049-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
