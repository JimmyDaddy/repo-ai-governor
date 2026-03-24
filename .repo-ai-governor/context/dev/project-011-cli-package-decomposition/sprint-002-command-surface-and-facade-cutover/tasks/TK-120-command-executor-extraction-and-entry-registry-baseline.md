# TK-120 通用命令执行器抽离与 entry registry 基线

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-002-command-surface-and-facade-cutover`

## 1. 任务目标

将 `init/connect/doctor/check/verify/plan/upgrade` 等命令执行逻辑从 `CliGovernanceRuntime` 中迁出，建立 `commands/*` 与统一 entry registry 基线。

## 2. Depends On

1. `TK-119`

## 3. 预期产物

1. `DA-118` command executor 与 entry registry 抽离基线产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-119-artifact-report-presentation-extraction.md`

## 5. 实施计划

1. 建立 `commands/*` 与 command registry 的最小目录/依赖结构。
2. 迁出非 run/review 命令执行逻辑，并保持输出/exit code 契约稳定。
3. 补齐 package/integration 测试并回写 `DA-118`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，开始建立 `commands/*`、统一 command context 与 entry registry 基线。
3. 2026-03-24：完成 `init/connect/doctor/check/verify/plan/upgrade` command executor 抽离、registry 接线、CLI regression 回归，并输出 `DA-118` / resolved review。
4. 2026-03-24：根据 follow-up CR 补齐 registry duplicate guard 与 facade dispatch smoke coverage，并将复核结果收尾为 resolved。

## 8. 产出

1. `DA-118` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-118-command-executor-extraction-and-entry-registry-baseline.md`
