# TK-099 任务驱动 DAG 与 `run` 主链装配

- Status: planned
- Date: 2026-03-24
- Owner: TBD
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-autonomous-mainchain-foundation`

## 1. 任务目标

将当前固定模板 `run` 升级为按任务目标、依赖产物、角色能力与策略结果装配的可执行 DAG，为 Stage 9 自动主链打底。

## 2. Depends On

1. `TK-098`
2. `TK-118`

## 3. 预期产物

1. `DA-103` 任务驱动 DAG 与 `run` 主链装配产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-098-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
7. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md`
8. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md`
9. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-123-project-011-exit-acceptance-and-project-010-rollout-input-constraints.md`
10. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/project-011-cli-package-decomposition-completion-audit-summary.md`

## 5. 实施计划

1. 定义任务目标、依赖产物、角色能力进入 DAG 装配的最小输入模型。
2. 将 `run` 从固定模板升级为可编译/可解释的任务驱动流程装配逻辑。
3. 新增主链装配逻辑时优先落到 `project-011` 已定义并已完成验收的 CLI decomposition 边界，避免继续扩张 `apps/cli/src/cli-governance-runtime.ts`。
4. 保留 fallback baseline，但明确其只作为降级路径，不再代表目标形态。
5. 补齐 runtime/contract/integration 测试并回写 `DA-103`。
6. 同步台账与 artifact registry。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- packages/core-process/test apps/cli/test --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-103` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/DA-103-task-driven-dag-and-run-mainchain-assembly.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`
