# Code Review: TK-101 working tree follow-up 2026-03-24 19:00

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-101`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`

## 1. Review Scope
1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/hitl-runtime.ts`
3. `apps/cli/src/constants/cli-task-driven-run.constant.ts`
4. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
5. `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`
6. `apps/cli/src/main.ts`
7. `apps/cli/test/cli-governance-runtime.integration.test.ts`
8. `apps/cli/package.json`
9. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
10. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
11. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-101-hitl-decision-receipt-and-resume-semantics.md`
12. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
13. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`

## 2. Findings
### 2.1 [P1] 真实 CLI 入口还不能提交 HITL decision receipt 参数
- 位置: `apps/cli/src/main.ts:274`
- 问题描述: `CliGovernanceRuntime` 已经消费 `hitlDecision / hitlDecisionReason / hitlResumeAction / hitlDecidedBy / hitlConstraints`，但 `main.ts` 既没有为这些字段注册 `program.option(...)`，`resolveRuntimeDebugOptions()` 也完全没有从 argv 解析它们。当前“approve/reject/revise + resume/terminate/degrade”只存在于测试里直接注入 `runtimeDebugOptions` 的路径，真实命令行调用无法触达。
- 影响: `TK-101` 声称的 decision receipt / resume 语义对 CLI 用户实际上不可用，HITL 运行时闭环仍停留在内部测试能力。
- 建议: 为所有新增 HITL 字段补齐 CLI 选项声明、argv 解析和输入校验，并至少补一条从 `runCli(argv)` 进入的端到端覆盖。

### 2.2 [P1] 高风险 `run --dry-run` 仍会触发真实 HITL 通知副作用
- 位置: `apps/cli/src/runtime/hitl-runtime.ts:58`
- 问题描述: `processRunHitl()` 的输入只接收 `hitlDecision*` 字段，不包含 `dryRun`，并且一旦 `policyResult.shouldTriggerHitl` 就会无条件 dispatch notification、写 `context/hitl/notifications/*.json` 并记录通知审计事件。这样 high-risk dry-run 虽然不再写 inline review/backfill，但仍会产生真实 HITL 通知副作用。
- 影响: dry-run 的“只诊断、不落地”语义依然不完整；当前 provider 只是写 artifact，但一旦接入真实 notification provider，就会把本应演练的 dry-run 变成真实通知。
- 建议: HITL runtime 也要显式继承 dry-run 语义；dry-run 下应只返回预测性的 notification diagnostics，而不是实际 dispatch/write。

### 2.3 [P2] 预先提供 approve decision 也不会真正恢复 task-driven review 子链
- 位置: `apps/cli/src/cli-governance-runtime.ts:1218`
- 问题描述: inline review guard 在 runtime 阶段内重新基于 `changedPaths` 计算原始 policy outcome，并在非 `allow` 时直接把 review 子链标成 `deferred`；真正的 `hitlDecision -> effectivePolicyOutcome` 解析要到 runtime 全部结束后才在 `processRunHitl()` 里发生。因此当调用方同时提供 `taskId + hitlDecision=approve` 时，最终 policy 可以被翻成 `allow`，但先前被跳过的 `stage-task-review / stage-task-review-verify` 不会补跑。
- 影响: `resume` 目前只改变最终 policy 结果，不会恢复已经被 defer 的 task-driven review 子链；这和 `TK-101` 的 `resume/terminate/degrade` 闭环目标仍有差距。
- 建议: inline review guard 需要消费 HITL resolution 结果，或把 HITL 解析前移到能够影响 review-stage dispatch 的位置；同时补 `taskId + hitlDecision=approve` 的组合回归测试。

## 3. Notes
1. 你上一轮贴出来的那条 “inline review subchain 的 dry-run 副作用” 在当前代码里已经修了：`resolveInlineReviewExecutionGuard()` 会在 `dryRun` 时直接返回 `dry_run` skip。
2. 当前新增测试覆盖了 `runtime.execute()` 注入 `hitlDecision=approve` 的 happy path，但没有覆盖真实 CLI argv 解析，也没有覆盖 `dry-run + HITL notification` 或 `taskId + approve + review subchain resume` 的组合路径。
3. 这轮是静态 CR，没有重跑 `vitest` / `pnpm run check`。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `rg -n "hitlDecision|hitlResumeAction|hitlDecisionReason|hitlDecidedBy|hitlConstraints" apps/cli/src/main.ts apps/cli/src -S`（通过）
4. `rg -n "program\\.option\\(|--dry-run|--task-id|--record-ledger|--restricted-network|--restricted-reason|--no-local-fallback" apps/cli/src/main.ts -S`（通过）
5. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（未执行）
6. `pnpm run check`（未执行）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] 真实 CLI 入口还不能提交 HITL decision receipt 参数`
   - 判定：**认可**
   - 证据：复核时 `apps/cli/src/main.ts` 确实只有 `--task-id / --dry-run / --replay / --restricted-*` 等 debug/runtime 选项，没有任何 `--hitl-*` 入口；当前 patch 已补上 `--hitl-decision / --hitl-decision-reason / --hitl-resume-action / --hitl-decided-by / --hitl-constraints` 的 `program.option(...)`、argv 解析和输入校验，并新增了 `runCli(argv)` 端到端覆盖。
   - 处理：已修复。
2. `2.2 [P1] 高风险 run --dry-run 仍会触发真实 HITL 通知副作用`
   - 判定：**认可**
   - 证据：复核时 `apps/cli/src/runtime/hitl-runtime.ts` 会在 `shouldTriggerHitl=true` 时直接 dispatch notification 并落 `context/hitl/notifications/*.json`；当前 patch 已将 `dryRun` 显式传入 HITL runtime，dry-run 分支只返回预测性 notification diagnostics，不再 dispatch/write/record notification receipt。
   - 处理：已修复。
3. `2.3 [P2] 预先提供 approve decision 也不会真正恢复 task-driven review 子链`
   - 判定：**认可**
   - 证据：复核时 inline review guard 会在 stage dispatch 内重新按原始 policy 结果判断，`hitlDecision` 的解析发生在 runtime 结束后，导致 `taskId + approve` 只会翻转最终 policy，而不会恢复已经 defer 的 review stages；当前 patch 已将 HITL preview 前移到 runtime 执行前，并让 inline review guard 消费 `effectivePolicyOutcome`，新增的 `taskId + approve` 集成测试已验证 review 子链会真正恢复执行。
   - 处理：已修复。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:packages -- @repo-ai-governor/cli @repo-ai-governor/notification-dispatcher --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-03-24）

1. `2.1 [P1] 真实 CLI 入口还不能提交 HITL decision receipt 参数`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/constants/cli-output.constant.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补齐了 `--hitl-*` CLI 参数、值校验和 `runCli(argv)` 端到端回归。
2. `2.2 [P1] 高风险 run --dry-run 仍会触发真实 HITL 通知副作用`：已完成
   - 变更文件：`apps/cli/src/runtime/hitl-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：dry-run 下只保留预测性 notification diagnostics，不再落真实 notification/decision receipt 副作用。
3. `2.3 [P2] 预先提供 approve decision 也不会真正恢复 task-driven review 子链`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/hitl-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：将 HITL resolution preview 前移到 runtime dispatch 之前，`taskId + hitlDecision=approve` 现在会真正恢复 inline review 子链执行。
