# TK-117 route fallback 与 diagnostics artifact builder 抽离

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-001-runtime-support-extraction-foundation`

## 1. 任务目标

将 `route selection`、`restricted-network fallback`、`diagnostics artifact payload builder` 等逻辑从 `CliGovernanceRuntime` 中拆出，形成可复用的 package-local runtime 模块。

## 2. Depends On

1. `TK-116`
2. `DA-113`

## 3. 预期产物

1. `DA-115` route fallback 与 diagnostics artifact builder 抽离基线产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-113-cli-package-decomposition-baseline-and-dependency-contract.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/TK-116-adapter-verification-and-local-probe-extraction.md`
4. `apps/cli/src/cli-governance-runtime.ts`

## 5. 实施计划

1. 拆分 `route dispatch / candidate surfaces / restricted fallback` 的运行时逻辑。
2. 拆分 safe_local / adapter verification / run diagnostics 等 artifact payload builder。
3. 保持 CLI 命令输出和审计产物语义不变，并补齐回归测试。
4. 回写 `DA-115`、artifact registry 与台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：进入 `in_progress`，开始抽离 route selection / restricted fallback / diagnostics artifact payload builder。
3. 2026-03-24：已完成 `CliAdapterRoutingRuntime`、`CliAdapterDiagnosticsRuntime`、verification/runtime test 补齐、`DA-115` 产物与 resolved review，任务状态切换为 `completed`。

## 8. 产出

1. `DA-115` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-115-route-fallback-and-diagnostics-artifact-builder-extraction.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/review/resolved_code_review_tk-117-route-fallback-and-diagnostics-artifact-builder-extraction.md`
