# TK-121 run/review 命令执行器抽离与 thin facade cutover

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-002-command-surface-and-facade-cutover`

## 1. 任务目标

完成 `run/replay/review/review-verify` 等命令执行器抽离，并将 `CliGovernanceRuntime` 收敛为仅负责 dispatch/assembly/error boundary 的薄 facade。

## 2. Depends On

1. `TK-119`
2. `TK-120`

## 3. 预期产物

1. `DA-119` run/review command executor 抽离与 thin facade cutover 产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-119-artifact-report-presentation-extraction.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-120-command-executor-extraction-and-entry-registry-baseline.md`

## 5. 实施计划

1. 迁出 run/replay/review/review-verify 等高复杂度命令逻辑。
2. 将 `CliGovernanceRuntime` 收敛为 façade，不再直接承担多类职责。
3. 补齐关键回归与 contract 断言，并回写 `DA-119`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，先从 `review/review-verify` 命令链抽离开始，逐步将 `CliGovernanceRuntime` 收敛为 thin facade。

## 8. 产出

1. `DA-119` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-119-run-review-command-executor-extraction-and-thin-facade-cutover.md`
