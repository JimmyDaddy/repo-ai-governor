# TK-179 project-017 启动与技术方案模块化治理重排

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-001-module-registry-and-loading-contract-baseline`

## 1. 任务目标

创建独立的 `project-017-technical-solution-modularization`，将“技术方案模块化按需加载与依赖治理”收敛为新的 active primary stream，并把已完成的 `project-015 / sprint-004` 从默认 active closeout surface 迁入 completed history。

## 2. Depends On

1. `.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/projects-overview.md`
5. `.repo-ai-governor/context/dev/index.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
7. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/project-015-memory-provider-pluginization-completion-audit-summary.md`
8. `.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/project-016-langgraph-runtime-productization-completion-audit-summary.md`

## 3. 预期产物

1. `project-017` 的 project/sprint/task skeleton。
2. `current-context.md` 与 completed history 的 active stream 切换。
3. `DA-179`
4. `resolved_code_review_tk-179-project-017-bootstrap-and-technical-solution-modularization-rebaseline.md`

## 4. 实施计划

1. 将 `project-015 / sprint-004` 从 `current-context.md` 的 active primary surface 迁入 completed history。
2. 创建 `project-017` 的 project plan、sprint plan、task/checklist/tasks.csv 骨架。
3. 同步 `projects-overview`、`dev/index` 与 `master execution plan` 的 active stream 描述。
4. 运行治理同步 gate，确认 bootstrap 后没有上下文与台账漂移。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 6. 执行记录

1. 2026-03-26：任务创建，目标是将 completed 的 `project-015 / sprint-004` 从 active surface 移出，并建立 `project-017` 的 bootstrap 主执行流。
2. 2026-03-26：状态切换为 `in_progress`，开始创建 `project-017` skeleton 并同步 `current-context` / history / master plan / projects overview / dev index。
3. 2026-03-26：已完成 `DA-179`、resolved review 与 `project-017 / sprint-001` bootstrap，active stream 已切换到技术方案模块化治理主线。
