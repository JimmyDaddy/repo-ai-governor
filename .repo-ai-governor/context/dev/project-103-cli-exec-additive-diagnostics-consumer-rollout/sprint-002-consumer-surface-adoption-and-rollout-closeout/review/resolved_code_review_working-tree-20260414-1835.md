# Code Review: sprint-002 consumer surface adoption and rollout closeout

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-launch-diagnostics-projection-runtime.ts`
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
4. `apps/cli/src/commands/connect-command.ts`
5. `apps/cli/src/commands/doctor-command.ts`
6. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
7. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
8. `apps/cli/test/commands/connect-command.test.ts`
9. `apps/cli/test/commands/doctor-command.test.ts`

## 2. Findings
### 2.1 [P1] Role-level `launch_diagnostics` drops additive cli_exec facts on real verification snapshots
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:248`、`apps/cli/src/runtime/adapter-diagnostics-runtime.ts:143`
- 问题描述: round-1 implementation 让 verify `role_binding_matrix` 与 report `verification.roles[]` 都直接从 `roleEvaluation.healthCheck` 派生 `launch_diagnostics`。但 production-shaped role health check 并不保留 `diagnostics[]`，会让 `shell_wrapped / process_tree_policy / spawn_error_code` 在 role rows 上回退丢失。
- 影响: sprint-002 目标要求 `connect / doctor / verify / report` 统一消费 additive `launch_diagnostics`；如果 role rows 只在 synthetic fixture 上成立，真实 verify/report consumer 仍会丢失 cli_exec preserved facts。
- 规范依据: 无直接 rule id；该项为 reviewer 基于 `adapter-verification-runtime.ts` 实际构造路径与当前 consumer mapping 的风险推断。
- 建议: role-level `launch_diagnostics` 应优先消费 resolved tool snapshot 的 health check，再回退 role health check；同时补一条 regression 覆盖 production-shaped role rows。

### 2.2 [P2] 新增 scenario tests 注入了真实运行态不会出现的 role diagnostics
- 位置: `apps/cli/test/runtime/agent-onboarding-runtime.test.ts:1304`、`apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts:167`
- 问题描述: 新增 tests 手工为 `roleEvaluations[].healthCheck` 注入 `diagnostics[]`，这与 `CliAdapterVerificationRuntime` 真实输出的 role health check shape 不一致。
- 影响: focused tests 会在 synthetic fixture 上全绿，但 shipped verify/report role surface 仍可能漏掉 launch diagnostics，形成 coverage gap。
- 规范依据: 无直接 rule id；该项为 reviewer 基于 changed branch coverage boundary 的风险推断。
- 建议: 把新增 tests 改为 production-shaped role rows，让 role health check 不再自带 diagnostics，断言 consumer 会回退读取 resolved tool snapshot。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 1；main agent 已逐条复核并全部接受。
2. 本 round 只收口 reviewer round 1 的 accepted findings；是否 clean 以新的 fresh reviewer recheck round 为准。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CliAdapterVerificationRuntime` 真实构造的 role health check 不保留 `diagnostics[]`，因此 role-level launch diagnostics 不能只读 `roleEvaluation.healthCheck`。
   - 处理：已接受，修复为 verify/report role rows 优先消费 resolved tool snapshot 的 health check，再回退 role health check。
2. `2.2`
   - 判定：**认可**
   - 证据：新增 scenario tests 先前用手工 role diagnostics 建模，与 production-shaped role snapshot 不一致，确实会遮住 `2.1`。
   - 处理：已接受，修复为新增 tests 明确使用不带 role diagnostics 的 runtime-shaped role rows，并断言 consumer 回退读取 tool snapshot。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：role-level verify/report launch diagnostics 已改为优先消费 resolved tool snapshot；role health check 仅作为 fallback。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`、`apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：scenario tests 已切换为 production-shaped role health check，不再用 impossible role diagnostics 掩盖真实 consumer path。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 accepted findings 已全部修复，并通过 focused runtime/command suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. sprint 是否 clean 仍取决于下一轮 fresh reviewer recheck；该轮将另起 `CR-002` 收口。
