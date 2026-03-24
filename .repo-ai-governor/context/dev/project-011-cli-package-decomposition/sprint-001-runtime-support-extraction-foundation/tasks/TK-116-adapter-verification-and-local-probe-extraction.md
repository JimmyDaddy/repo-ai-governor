# TK-116 adapter verification 与 local probe 模块抽离

- Status: planned
- Date: 2026-03-24
- Owner: TBD
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-001-runtime-support-extraction-foundation`

## 1. 任务目标

将 `CliGovernanceRuntime` 中的 adapter verification、tool snapshot、local probe、failure attribution 等高 churn 逻辑抽离到独立 runtime 模块。

## 2. Depends On

1. `DA-113`

## 3. 预期产物

1. `DA-114` adapter verification 与 local probe 抽离基线产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-113-cli-package-decomposition-baseline-and-dependency-contract.md`
5. `apps/cli/src/cli-governance-runtime.ts`

## 5. 实施计划

1. 识别 verification / local probe 相关方法及其类型依赖。
2. 将逻辑迁入 `apps/cli/src/runtime/*` 下的 package-local 模块，并保持契约稳定。
3. 补齐针对新模块的 package test / integration test 覆盖。
4. 回写 `DA-114`、artifact registry 与台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-114` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-114-adapter-verification-and-local-probe-extraction.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv`
