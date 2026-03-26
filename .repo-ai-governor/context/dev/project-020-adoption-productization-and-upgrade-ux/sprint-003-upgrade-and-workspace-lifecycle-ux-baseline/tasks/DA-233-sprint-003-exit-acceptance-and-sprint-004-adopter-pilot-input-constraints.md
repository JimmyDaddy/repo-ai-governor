# DA-233 sprint-003 exit acceptance and sprint-004 adopter pilot input constraints

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-233`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`

## 1. Summary

1. `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline` 的 3 条 exit criteria 已全部满足：
   - `upgrade` 已具备 schema diff、migration suggestions、confirmation items 与 rollback reference 的明确 CLI 出口
   - workspace lifecycle 已具备 dry-run、execute、rollback 与 failure summary 的正式 CLI 用户路径
   - adopter 可以直接从 CLI 输出理解“将改什么、如何执行、失败后如何回滚”，而不是只依赖底层 service artifact
2. 由于下一条主执行流尚未显式激活，`current-context.md` 可临时保留 `sprint-003` 作为 active closeout surface；但 `plan.md`、`tasks.csv` 与 task cards 已全部切为 completed 真值。

## 2. Sprint-004 Input Constraints

1. `sprint-004-adopter-pilot-and-documentation-closure` 不再补内部 CLI 结构能力，而应直接进入真实 adopter 仓库试点。
2. 试点必须至少覆盖：
   - clean-room install / init
   - `upgrade` schema diff + confirmation review
   - `workspace` dry-run + execute + rollback rehearsal
3. sprint-004 的文档收口必须基于真实 pilot evidence：
   - support matrix
   - troubleshooting
   - playbook / known limitations
4. 若 pilot 发现新的 truthfulness gap，应优先回灌 docs/gates，而不是再堆内部治理层。

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-code-review-status-sync.js`
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
9. `node ./scripts/governance/check-worktree-review-target.js`

## 4. Key Outputs

1. [DA-231-upgrade-command-user-path-and-confirmation-rollback-reference-baseline.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/tasks/DA-231-upgrade-command-user-path-and-confirmation-rollback-reference-baseline.md)
2. [DA-232-workspace-lifecycle-cli-dry-run-execute-rollback-failure-summary-baseline.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/tasks/DA-232-workspace-lifecycle-cli-dry-run-execute-rollback-failure-summary-baseline.md)
3. [sprint-003 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/plan.md)
4. [project-020 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/plan.md)
