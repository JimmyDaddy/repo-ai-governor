# Code Review: working tree 2026-03-24 17:10

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope
1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/commands/review-verify-command.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/task-driven-run-runtime.ts`
5. `scripts/governance/sync-task-ledger.js`
6. `apps/cli/test/cli-governance-runtime.integration.test.ts`
7. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
8. `packages/core-memory/src/memory-manager.ts`
9. `packages/core-session/src/audit-recorder.ts`
10. `packages/core-session/src/shared-session-manager.ts`
11. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/plan.md`
12. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/TK-130-ledger-single-source-residual-closure-and-auto-sync-generator.md`
13. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/TK-131-inline-review-subchain-and-status-abstraction-closure.md`
14. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/TK-133-runtime-memory-selective-injection-and-dependency-scoped-snapshots.md`

## 2. Findings
### 2.1 [P1] `review-verify` 在多 request 队列下无法按 `taskId` 定向消费
- 位置: `apps/cli/src/commands/review-verify-command.ts:64`
- 问题描述: `review-verify` 先收集全部 queued request，然后无条件挑最后一条 `latestQueuedRequest` 继续处理；后面的 `taskId` 只用于 backfill 元数据，不参与 request 选择。结果是在多个 task 同时排队时，执行者即使按 `review` 输出提示带上 `--task-id <TK-xxx>`，也仍可能消费到另一个更新的 request。
- 影响: managed review chain 会把 verifier 动作、verify artifact 与后续 ledger backfill 绑定到错误任务，破坏并发 review 子链的隔离性。
- 建议: 当传入 `--task-id` 时，先按 request payload 中的 `taskId` 过滤 queued request；若没有匹配项则明确失败，而不是回退为“取最新一条”。

### 2.2 [P1] managed ledger backfill 失败时会先吞掉源 request，再抛错
- 位置: `apps/cli/src/commands/review-verify-command.ts:154`
- 问题描述: 代码先写出 `ledger-backfill` / `verify` 工件，并把源 request 改写为 `status=verified`、`consumedAt`、`consumedByVerifyId`，然后才在 `ledgerBackfillStatus === failed` 时抛错。这样一旦 `sync-task-ledger.js` 解析失败或执行失败，队列里的 request 已经不再是 `queued`，后续 `review-verify` 无法重试同一条链路。
- 影响: managed chain 的失败会把最需要重试的 request 直接从队列中移除，造成“报错但不可恢复”的状态；执行者只能重新发起新的 `review` 请求，审计链也会被切断。
- 建议: 只有在 managed backfill 成功时才把源 request 标记为 `verified/consumed`；失败时应保留为可重试状态，或显式写成 `failed` 并让 queue/runtime 支持后续恢复。

### 2.3 [P2] `sync-task-ledger` 不会用 TK 新执行记录刷新已有 checklist 摘要
- 位置: `scripts/governance/sync-task-ledger.js:353`
- 问题描述: `renderChecklist()` 只要发现 checklist 里已有 detail lines，就直接复用旧内容，不再从 task card 的 `执行记录` 重新生成摘要。结果是 canonical `TK` 执行记录后续新增或修订时，同步器不会把这些变更回写到 checklist。
- 影响: checklist 会长期保留过期摘要，`TK -> checklist` 不再满足单写源派生语义，review/verify 或手工状态更新后更容易形成静默漂移。
- 建议: 以 task card `执行记录` 作为 checklist detail 的基线，再在需要时追加 runtime 注入的 `checklistNote`；不要把旧 checklist 细节视为比 canonical `TK` 更高优先级。

## 3. Notes
1. 我把 `review --record-ledger --task-id <TK-xxx>` 输出文案视为 managed chain 的公开契约，因此本轮按“`taskId` 应能定向收口同一条 review 子链”来判断 correctness。
2. `current-context.md` 当前仍保留 `Primary Stream` 段，因此本轮没有把 project/sprint stream metadata 解析列为正式问题。
3. 未重跑完整 `vitest`/`pnpm run check`；本轮以 working tree 静态审查为主，并补做了一个最小脚本复现来确认 checklist 同步问题。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir <tmp>`（通过；最小复现确认已有 checklist detail line 时不会被 TK 新执行记录刷新）
4. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts packages/core-memory/test/memory-manager.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（未执行）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] review-verify 在多 request 队列下无法按 taskId 定向消费`
   - 判定：**认可**
   - 证据：`review-verify` 现在会在消费 queued request 前按 `taskId` 做显式匹配，并在未命中时直接失败；新增命令级回归覆盖了“同队列多 task 并存时只消费指定 task”和“无匹配 taskId 时显式报错”。
   - 处理：已修复，managed review chain 不再把 `--task-id` 退化成仅用于 backfill 元数据的旁路参数。
2. `2.2 [P1] managed ledger backfill 失败时会先吞掉源 request，再抛错`
   - 判定：**认可**
   - 证据：managed ledger backfill 失败时，源 request 现保持 `queued`，只记录最近一次 verify 尝试与失败诊断；新增命令级回归确认失败后 request 可重试，verify artifact 会标成 `failed`。
   - 处理：已修复，review 子链从“报错但不可恢复”改回可重试语义。
3. `2.3 [P2] sync-task-ledger 不会用 TK 新执行记录刷新已有 checklist 摘要`
   - 判定：**认可**
   - 证据：`sync-task-ledger` 现在以 canonical `TK` 的 `执行记录` 为 checklist detail 基线，只在当前同步请求显式传入 `checklistNote` 时附加运行时摘要；新增 integration test 已覆盖“旧 checklist 摘要被 canonical note 刷新”的路径。
   - 处理：已修复，checklist 恢复为 `TK` 单写源派生视图。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts test/sync-task-ledger.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `pnpm run check`（通过）

## 修复执行记录（2026-03-24）

1. `2.1 [P1] review-verify 在多 request 队列下无法按 taskId 定向消费`：已完成
   - 变更文件：`apps/cli/src/commands/review-verify-command.ts`、`apps/cli/test/commands/review-verify-command.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`review-verify` 现会优先按 `--task-id` 选择匹配的 queued request；无匹配项时不会再误消费最新一条。
2. `2.2 [P1] managed ledger backfill 失败时会先吞掉源 request，再抛错`：已完成
   - 变更文件：`apps/cli/src/constants/cli-governance-runtime.constant.ts`、`apps/cli/src/commands/review-verify-command.ts`、`apps/cli/test/commands/review-verify-command.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：managed backfill 失败时源 request 保持 `queued` 并记录失败诊断，后续可以继续重试同一条 chain。
3. `2.3 [P2] sync-task-ledger 不会用 TK 新执行记录刷新已有 checklist 摘要`：已完成
   - 变更文件：`scripts/governance/sync-task-ledger.js`、`test/sync-task-ledger.integration.test.ts`
   - 验证：`pnpm -s vitest run test/sync-task-ledger.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：checklist detail 现在以 canonical `TK` 执行记录为基线，只按当前同步请求附加 `checklistNote`，不再继承旧摘要。
