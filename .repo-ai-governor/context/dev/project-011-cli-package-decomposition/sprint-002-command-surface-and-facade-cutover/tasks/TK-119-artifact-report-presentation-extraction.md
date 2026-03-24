# TK-119 artifact/report/presentation 模块抽离

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-002-command-surface-and-facade-cutover`

## 1. 任务目标

将 diagnostics/report/replay/experience shaping 等 artifact 与 presentation 逻辑从 `CliGovernanceRuntime` 中抽离为可独立测试的模块。

## 2. Depends On

1. `TK-118`

## 3. 预期产物

1. `DA-117` artifact/report/presentation 模块抽离基线产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-116-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
3. `apps/cli/src/cli-governance-runtime.ts`

## 5. 实施计划

1. 抽离 diagnostics trace、review queue、experience payload、replay explain 等模块。
2. 保持 CLI 输出契约稳定，并补齐 package/integration 回归。
3. 回写 `DA-117`、artifact registry 与台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，开始梳理 `CliGovernanceRuntime` 中剩余的 artifact/report/presentation 责任并实施第一轮抽离。
3. 2026-03-24：完成 `runtime-artifact-writer`、`review-queue-runtime`、`command-experience-builder`、`replay-explain-builder` 抽离，补齐 package/integration 回归、`DA-117` 与 resolved review。

## 8. 产出

1. `DA-117` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-117-artifact-report-presentation-extraction.md`
