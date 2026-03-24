# TK-126 启动基线与规范加载分层对齐

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 任务目标

对齐 `AGENTS.md`、维护指南与 `normative-loading-manifest` 的默认启动语义，建立“L0 默认加载、L1 按需补载”的一致执行基线。

## 2. Depends On

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`

## 3. 预期产物

1. `DA-124` 启动基线与规范加载分层对齐产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
2. `AGENTS.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/context/current-context.md`

## 5. 实施计划

1. 对比 `AGENTS`、maintenance guide 与 manifest 的启动基线定义，识别默认加载与触发补载的分歧点。
2. 收敛当前仓库的默认启动集合，明确哪些文档属于 L0 必读、哪些文档必须转为按需触发。
3. 保持 triad、governance 与 current-context 的事实链路不变，但减少“所有任务都默认重读 L1”的入口压力。
4. 补齐验证说明与 `DA-124`，并回写台账。

## 6. 验证

1. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，状态切换为 `active`，作为 sprint-001 首个执行任务。
3. 2026-03-24：完成 `AGENTS.md` 与 `long-term-maintenance-guide.md` 的启动基线收敛，统一为 manifest 驱动的 `L0 默认加载 + L1 按需补载`。
4. 2026-03-24：产出 `DA-124`，记录默认启动集合、补载触发边界与后续 rollout 约束。

## 8. 产出

1. `DA-124` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-124-startup-baseline-and-normative-loading-alignment.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/tasks.csv`
