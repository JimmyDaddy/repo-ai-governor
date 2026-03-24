# Code Review: TK-100 working tree follow-up 2026-03-24 18:18

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-100`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope
1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/task-driven-run-runtime.ts`
3. `apps/cli/src/runtime/presentation/command-experience-builder.ts`
4. `apps/cli/src/constants/cli-task-driven-run.constant.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
7. `apps/cli/test/runtime/command-experience-builder.test.ts`
8. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-100-inline-review-chain-and-ledger-backfill-closure.md`
9. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/DA-104-inline-review-chain-and-ledger-backfill-closure.md`
10. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
11. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`
12. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
13. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
14. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings
### 2.1 [P1] inline review 子链会在 policy gate 之前落地真实 side effects
- 位置: `apps/cli/src/cli-governance-runtime.ts:298`
- 问题描述: `run` 现在把 `stage-task-review` 与 `stage-task-review-verify` 放进 `processRuntimeEngine.execute()` 里先执行，而风险评估与 `policyGateEngine.evaluate()` 要到 runtime 全部结束后才发生。这样一来，task-driven `run` 即使最终命中 `confirm/block`，review request/result、ledger backfill，乃至 `tasks/checklist/tasks.csv` 的 managed 回写都已经真实落地。
- 影响: 高风险或需 HITL 的运行会在最终策略判定之前提前关闭 review 子链并写入台账，破坏“先策略决策、后收口审计/交付”的治理顺序，也会让被 block 的执行看起来像已经完成 review/backfill。
- 建议: 把 inline review 子链移到 policy allow 之后，或至少让 review/review-verify 在 non-allow policy 路径下只产出待处理意图而不写回 queue/backfill/task ledger。

### 2.2 [P1] `run --dry-run` 仍会通过 inline review 子链修改 review queue 与任务台账
- 位置: `apps/cli/src/cli-governance-runtime.ts:1072`
- 问题描述: `dispatchInlineReviewSubchainStage()` 直接复用 `CliReviewCommand` / `CliReviewVerifyCommand`，并强制把 `recordLedger` 设为 `Boolean(taskId)`；这两个 command executor 都不会检查 `dryRun`。因此 task-driven `run --dry-run` 只要带 `taskId`，就仍会创建 review request/result/backfill 工件，并可能通过 managed ledger backfill 改写 `tasks/checklist/tasks.csv`。
- 影响: dry-run 失去“只诊断、不落地”的核心语义。调用方原本可能只想看 DAG/diagnostics/policy 结果，却会得到真实的 review queue 与 ledger 副作用，严重干扰调试和回归验证。
- 建议: inline review 子链必须显式继承 dry-run 语义；最小修复是 dry-run 时跳过 `CliReviewCommand` / `CliReviewVerifyCommand` 的真实写盘，改为返回模拟的 review-chain diagnostics。

## 3. Notes
1. 这轮我重新核了上一个 follow-up 里提到的 `review-verify` queue 选择与 backfill 失败重试问题；当前 `apps/cli/src/commands/review-verify-command.ts` 已补上 `taskId` 定向选择与失败保留 `queued` 状态，所以没有把旧 finding 直接沿用到本轮。
2. 当前新增测试只覆盖了 `task-driven + allow + 非 dry-run` 的 happy path，尚未覆盖“inline review chain + policy non-allow”或“inline review chain + dry-run”两个高风险分支。
3. 本轮是静态 CR，没有重跑 `vitest` 或 `pnpm run check`；验证以 diff、代码路径和现有测试覆盖面审查为主。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `rg -n "dryRun|recordLedger|stage-task-review|stage-task-review-verify" apps/cli/src apps/cli/test -S`（通过）
4. `pnpm -s vitest run apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（未执行）
5. `pnpm run check`（未执行）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] inline review 子链会在 policy gate 之前落地真实 side effects`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts` 中的 `dispatchInlineReviewSubchainStage()` 先调用 `resolveInlineReviewExecutionGuard()`；该 guard 会基于当前 worktree 的风险事实重新评估 policy，命中 `confirm/escalate/block` 时只返回 `deferred` 诊断状态，不再调用 `CliReviewCommand` / `CliReviewVerifyCommand`。
   - 处理：已接受并修复。
2. `2.2 [P1] run --dry-run 仍会通过 inline review 子链修改 review queue 与任务台账`
   - 判定：**认可**
   - 证据：同一 guard 现已在 `dryRun=true` 时直接返回 `dry_run` 状态；新增集成测试验证 task-driven dry-run 不会创建 review queue/result/backfill artifacts，也不会触发 managed ledger backfill。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-03-24）

1. `2.1 [P1] inline review 子链会在 policy gate 之前落地真实 side effects`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/presentation/command-experience-builder.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm run check`（通过）
   - 说明：inline review 子链在真实执行前新增即时 policy gate；命中 non-allow 时仅输出 `deferred` 诊断状态，不再创建 review queue/result/backfill 或任务台账副作用。
2. `2.2 [P1] run --dry-run 仍会通过 inline review 子链修改 review queue 与任务台账`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/presentation/command-experience-builder.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：task-driven `run --dry-run` 现在只保留 `dry_run` 诊断状态和对应 experience，不再真实写盘 review queue / ledger backfill。
