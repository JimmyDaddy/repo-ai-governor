# TK-100 review 子链内联与 ledger backfill 收口

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-autonomous-mainchain-foundation`

## 1. 任务目标

将 `review -> review-verify -> ledger backfill` 收敛为自动主链可控子链，同时保持 `inline/externalized` 双形态的审计事实一致。

## 2. Depends On

1. `TK-099`

## 3. 预期产物

1. `DA-104` review 子链内联与 ledger backfill 收口产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 将 review chain 定义为自动主链的受控子链，并显式绑定 `review / review-verify / ledger backfill` 节点语义。
2. 明确 `inline` 与 `externalized` 双形态下的 audit facts、report links 与 ledger contract 一致性。
3. 在 runtime 与 CLI 输出中补齐 review chain 进度、失败原因与下一步动作。
4. 补齐集成测试与 `DA-104`。
5. 同步台账与 artifact registry。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- apps/cli/test packages/core-runtime/test --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，先收敛 review 默认输出路径的 completed-stream 偏移问题；引入单值 `Worktree Review Target` override、自动退出规则与 stale-target gate，确保 worktree 仍归属于已 completed stream 时 CR 不会误写到后续 active sprint。
3. 2026-03-24：将 `review / review-verify` 以内联子链节点形式接入 task-driven `run`，使 `stage-task-review` 与 `stage-task-review-verify` 通过受控 command context 执行并保留 managed ledger backfill 语义；核心验证已通过 `tsc --noEmit`、定向 vitest 和 `@repo-ai-governor/cli` 包级测试。
4. 2026-03-24：已完成 `DA-104`、resolved review、artifact registry 与 sprint 台账同步；`run` 结果现显式暴露 inline review chain artifacts/details/progress，任务状态更新为 `completed`。
5. 2026-03-24：根据 follow-up CR 修正 inline review 子链的 side-effect gate；当前 `dry-run` 与 policy non-allow 路径仅输出 `dry_run/deferred` 诊断状态，不再真实写入 review queue、ledger backfill 或任务台账。
6. 2026-03-24：follow-up CR 已收尾为 `resolved`；两条 P1 finding 均已修复并通过 `pnpm run check` 复验。

## 8. 产出

1. `DA-104` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/DA-104-inline-review-chain-and-ledger-backfill-closure.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`
