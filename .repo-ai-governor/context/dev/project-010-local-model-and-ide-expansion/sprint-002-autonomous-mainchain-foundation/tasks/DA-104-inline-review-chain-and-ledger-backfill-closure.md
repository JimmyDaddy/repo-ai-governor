# DA-104 review 子链内联与 ledger backfill 收口

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-104`
- Produced By: `TK-100`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

固化 `project-010 / sprint-002` 中 `review -> review-verify -> ledger backfill` 作为自动主链受控子链的最小闭环实现，确保 `run` 在 task-driven 模式下能够以 inline 方式推进 review chain，同时保持 queue/result/backfill artifacts、CLI 输出与审计事实的一致性。

## 2. 已收口的实现面

1. task-driven `run` 已具备 review 子链节点装配
   - `apps/cli/src/runtime/task-driven-run-runtime.ts` 在 task-driven 组装路径中追加 `stage-task-review` 与 `stage-task-review-verify`，并将 `managedReviewChain`、`reviewRoleProfileId`、`reviewVerifyRoleProfileId` 注入 stage inputs。
2. inline review 子链已复用既有 command executors
   - `apps/cli/src/cli-governance-runtime.ts` 现将 review 子链节点识别为内建阶段，并通过受控 command context 直接调用 `CliReviewCommand` / `CliReviewVerifyCommand`，避免另起平行实现。
3. ledger backfill 语义保持统一
   - `review-verify` 仍通过同一条 managed ledger backfill 路径写入 `context/ledger-backfill/review-verify/*.json`，并继续复用 `sync-task-ledger.js` 写回 `tasks/checklist/tasks.csv`。
4. `run` 输出已具备 review chain 外显契约
   - `commandResult.artifacts` 现在显式挂出 `inline_review_request`、`inline_review_verify_result`、`inline_review_ledger_backfill`。
   - `commandResult.details` 现在显式挂出 `inline_review_chain_enabled/status/*_path`。
   - `commandResult.checks` 现在新增 `review_chain` 检查项。
5. CLI experience payload 已具备语义化 progress
   - `apps/cli/src/runtime/presentation/command-experience-builder.ts` 现在将 inline review 子链映射为 `REVIEW / REVIEW_VERIFY / LEDGER_BACKFILL` 进度行，而不再只显示泛化的 `RUN_RUNTIME` 阶段。
6. inline review 子链现在遵循 side-effect gate
   - `dry-run` 模式下，review chain 只输出 `dry_run` 诊断状态，不创建 review queue/result/backfill artifacts，也不写回任务台账。
   - 当前 worktree 风险若命中 `confirm / escalate / block`，inline review 子链会先停在 `deferred`，避免在最终策略非 `allow` 时提前落地 queue/backfill/task ledger 副作用。

## 3. 一致性结论

1. inline 与 externalized 两条路径共享同一组 review/request/result/backfill artifacts 语义。
2. `run` 只是改变了 review 子链的触发方式，没有引入第二套 ledger backfill 契约。
3. 由于仍复用 `review` 与 `review-verify` command executor，后续 `TK-101` 的 HITL 决策回灌可以继续沿同一 command/runtime 边界演进。
4. `dry-run` 与 non-allow policy 分支现在都不会伪装成“已真实完成 review/backfill”，而是只保留可诊断的 skip/deferred 事实。

## 4. 关键验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
8. `pnpm run check`

## 5. 最终结论

1. 当前状态：`accepted`
2. 结论：`TK-100` 已完成自动主链中 review 子链内联与 managed ledger backfill 收口，`DA-104` 现作为 `TK-101` 与 `TK-102` 的正式输入证据。
