# TK-159 project-015 启动与 memory provider pluginization 重排

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-001-registry-and-plugin-resolution-baseline`

## 1. 任务目标

创建独立的 `project-015-memory-provider-pluginization`，将 post-Stage-9 的 memory provider modularization 收敛为新的 active stream，并把已完成的 `project-014 / sprint-003` 从默认 active surface 迁入 completed history。

## 2. Depends On

1. `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/projects-overview.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
6. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. `project-015` 的 project/sprint/task skeleton。
2. `current-context.md` 与 completed history 的 active stream 切换。
3. `resolved_code_review_working-tree-20260325-2342.md`

## 4. 实施计划

1. 将 `project-014 / sprint-003` 从 `current-context.md` 的 active primary surface 迁入 completed history。
2. 创建 `project-015` 的 project plan、sprint plan、task/checklist/tasks.csv 骨架。
3. 同步 `projects-overview`、`dev/index` 与 `master execution plan` 的 active stream 描述。
4. 跑治理同步 gate，确保 bootstrap 后没有上下文与台账漂移。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`

## 6. 执行记录

1. 2026-03-26：任务创建，目标是将 completed 的 `project-014 / sprint-003` 从 active surface 移出，并建立 `project-015` 的 bootstrap 主执行流。
2. 2026-03-26：状态切换为 `in_progress`，开始创建 `project-015` skeleton 并同步 `current-context` / history / master plan。
3. 2026-03-26：已完成 `DA-159`、resolved review、`project-015 / sprint-001` 收口，以及 active stream 向 `sprint-002-built-in-registry-and-loader-foundation` 的切换。
