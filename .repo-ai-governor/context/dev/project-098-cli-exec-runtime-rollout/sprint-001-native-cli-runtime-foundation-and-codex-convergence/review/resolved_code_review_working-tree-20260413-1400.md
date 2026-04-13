# Code Review: sprint-001-native-cli-runtime-foundation-and-codex-convergence round 1

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
2. `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`
4. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
5. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`

## 2. Findings

### 2.1 [P1] Shared runtime swallowed non-zero child exits

- 位置:
  - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
- 问题描述: shared runtime 的 `close` 路径先前只对 timeout / abort 做 reject，导致 `Codex` 通过 shared runtime 执行 probe/invoke 时，只要 stdout 仍可解析，就可能把非零退出当成成功结果继续向上游暴露。
- 影响: failing `cli_exec` process 可能被错误标记为成功，削弱 probe / invoke truthfulness 与后续 liveness 判断的可靠性。
- 建议: 在 shared runtime 内统一拒绝非零 exit code 或 signal close，并保留 launch diagnostics / exit details 供 adapter 层报告。

### 2.2 [P2] Shared runtime regression suite missed the failing-exit branch

- 位置:
  - `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
- 问题描述: dedicated runtime suite 只覆盖成功路径与 timeout escalation，没有覆盖 `exitCode != 0` 的 close 分支，因此 failing-exit regression 可以在 focused suite 绿灯下漏出。
- 影响: lifecycle-sensitive runtime regression 缺少守护，会降低后续 shared runtime 扩面的安全性。
- 建议: 增加 failing child exit regression case，并断言 shared runtime 会 reject 且保留 redacted process details。

## 3. Notes

1. reviewer 未在 sprint-001 的 shared runtime / Codex convergence boundary 上发现除以上两条之外的新增 actionable finding。
2. 本轮 accepted 修复保持在 sprint-001 ownership boundary 内完成，没有新增 public ACP surface、canonical transport truth 或 support wording。

## 4. Verification

1. `pnpm run build`（通过，reviewer round 前）
2. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`（通过，reviewer round 前）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过，reviewer round 前）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，reviewer round 前）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过，reviewer round 前）

## 复核结论（2026-04-13）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] Shared runtime swallowed non-zero child exits`
   - 判定：**认可**
   - 证据：`NativeCliExecProcessRuntime` 现已在 shared `close` path 上拒绝非零退出或 signal close，并在 `RuntimeError.details` 中保留 `exitCode`、`signal` 与 launch diagnostics；shared runtime 不再把 failing child exit 作为成功结果向 `Codex` 暴露。
   - 处理：保留为 accepted finding，已完成修复并进入验证。
2. `2.2 [P2] Shared runtime regression suite missed the failing-exit branch`
   - 判定：**认可**
   - 证据：`native-cli-exec-process-runtime.unit.test.ts` 已新增 `exitCode=7` regression case，断言 shared runtime 会 reject 且保留 redacted process details。
   - 处理：保留为 accepted finding，已完成修复并进入验证。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 修复执行记录（2026-04-13）

1. `2.1 [P1] Shared runtime swallowed non-zero child exits`：已完成
   - 变更文件：
     - `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：shared runtime 现统一拒绝非零 exit code / signal close，避免 adapter 将 failing process surface 成功化。
2. `2.2 [P2] Shared runtime regression suite missed the failing-exit branch`：已完成
   - 变更文件：
     - `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
   - 说明：新增 failing-exit regression case，确保 shared runtime 失败语义在后续 cross-adapter rollout 中有直接守护。
