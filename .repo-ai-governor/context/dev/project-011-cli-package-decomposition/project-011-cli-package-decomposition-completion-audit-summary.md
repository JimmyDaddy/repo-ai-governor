# project-011 CLI package decomposition 完成态审计摘要

- Status: completed
- Date: 2026-03-24
- Project: `project-011-cli-package-decomposition`
- Scope: `sprint-001-runtime-support-extraction-foundation` + `sprint-002-command-surface-and-facade-cutover` + `sprint-003-package-hardening-and-rollout-alignment`

## 1. 审计结论

`project-011-cli-package-decomposition` 已达到完成态，可作为 `project-010` 后续 CLI 主链与 rollout 工作的正式工程边界输入。

## 2. 审计范围

1. project/sprint/task 台账一致性与完成状态
2. `DA-113`~`DA-123` 产物链路完整性
3. `apps/cli` 的 command/runtime/artifact/presentation/package-local 边界收敛结果
4. `project-010` 的正式回链与 handoff 输入约束

## 3. 审计结果

1. 项目层状态
   - `project-011` 计划状态已切换为 `completed`。
2. sprint 层状态
   - `sprint-001`、`sprint-002`、`sprint-003` 均已完成并形成对应 `DA-*` handoff。
3. 任务层状态
   - 最新执行记录聚合结果：`TK-115`~`TK-125` 共 `11` 个任务，`11/11 completed`。
4. 产物链路
   - sprint-001：`DA-113`~`DA-116`
   - sprint-002：`DA-117`~`DA-120`
   - sprint-003：`DA-121`~`DA-123`
5. 工程边界结论
   - `apps/cli` 已建立 `commands/*`、`runtime/*`、`runtime/artifacts/*`、`runtime/presentation/*` 的 bounded-context 分层。
   - `CliGovernanceRuntime.execute()` 已收敛为统一 registry dispatch，不再保留 `RUN` 的特殊旁路。
   - shared/package-local 边界与 package exports 基线已冻结，当前无需上提 CLI 专属模块到 shared。
6. rollout 回链
   - `project-010` 已更新为消费 `DA-121`、`DA-122`、`DA-123` 与本审计摘要，作为 sprint-002 的正式工程输入。

## 4. 门禁复跑

1. `pnpm -s tsc -p tsconfig.json --noEmit`：通过
2. `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`：通过
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`：通过
4. `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`：通过
5. `node ./scripts/governance/check-task-ledger-sync.js`：通过
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`：通过
7. `node ./scripts/governance/check-code-review-status-sync.js`：通过
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`：通过
9. `pnpm run check`：通过

## 5. 证据路径

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/plan.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/plan.md`
5. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/checklist.md`
8. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv`
9. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/tasks.csv`
10. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/tasks.csv`
11. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-119-run-review-command-executor-extraction-and-thin-facade-cutover.md`
12. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md`
13. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md`
14. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-123-project-011-exit-acceptance-and-project-010-rollout-input-constraints.md`
15. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 6. 后续输入建议

1. `project-010` 在推进 `TK-099` 及之后的自动主链任务时，应优先复用 `project-011` 已冻结的 command/runtime/presentation/package-local 边界。
2. 若未来需要进一步削薄 `CliGovernanceRuntime`，应作为新的工程支撑任务单独立项，而不是在自动主链任务中顺带扩张。
3. 任何新的 CLI public surface 扩展都必须同步补 root integration smoke，并回写 `DA-122` 类测试拓扑结论。
