# Code Review: sprint-001 compatibility taxonomy and regression harness

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

## 1. Review Scope
1. `test/native-cli-exec-compatibility-harness.ts`
2. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
3. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
4. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
5. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
6. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
7. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`

## 2. Findings
### 2.1 [P2] Verify-matrix fixture relies on a nonexistent cancellation enum member
- 位置: `apps/cli/test/runtime/agent-onboarding-runtime.test.ts:1071`
- 问题描述: 测试 fixture 使用 `AdapterRequestCancellationMode.PROCESS_SIGNAL`，但该枚举成员并不存在。运行时这里会变成 `undefined`，随后由 helper 回退为 `not_supported`，导致断言在错误前提下通过，无法真正证明 authored cancellation truth 被保留。
- 影响: 这会让 compatibility baseline 对 `request_cancellation_mode` 的验证失真，回归时可能出现假绿。
- 建议: 改成真实的 CLI exec authored truth，例如 `AdapterRequestCancellationMode.NOT_SUPPORTED`，避免依赖 fallback coercion。

### 2.2 [P2] Claude CLI malformed invoke path still lacks preserved-facts coverage
- 位置: `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts:1196`
- 问题描述: 当前只补了 `probe_protocol_parse_failed`，但 `invokeStage()` 的 malformed CLI output 仍没有 `invoke_protocol_parse_failed` taxonomy 断言。Codex 和 GitHub Copilot 已覆盖 probe + invoke 两类 parse failure，Claude 这里仍有空洞。
- 影响: 如果 Claude 的 invoke parse-failure 路径丢失 `selectedEntrypoint`、`shellWrapped` 或 `processTreePolicy`，当前 sprint 不会捕捉到。
- 建议: 增加 Claude malformed invoke case，并从 `RuntimeError.details` 断言 `expectNativeCliExecPreservedFacts('invoke_protocol_parse_failed', ...)`。

### 2.3 [P3] Shared taxonomy declares `non_zero_exit` but no test exercises it
- 位置: `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts:62`
- 问题描述: harness 已把 `non_zero_exit` 声明为必测 scenario class，但对应 runtime test 仍停留在原始 `toMatchObject()`，没有通过 shared helper 验证 preserved-facts taxonomy。
- 影响: `non_zero_exit` 这个 scenario class 可能与其余场景发生 taxonomy 漂移而不被发现。
- 建议: 捕获抛出的错误详情，并增加 `expectNativeCliExecPreservedFacts('non_zero_exit', ...)`，同时保留现有 exit-code 断言。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 1，后续将由 main agent 逐条复核并决定 accepted / rejected / deferred。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（通过）
4. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`AdapterRequestCancellationMode` 枚举中不存在 `PROCESS_SIGNAL` 成员；该 fixture 当前确实依赖 fallback coercion 才通过。
   - 处理：改成真实 authored truth，并避免用错误枚举值掩盖 regression。
2. `2.2`
   - 判定：**认可**
   - 证据：Claude smoke 覆盖了 `probe_protocol_parse_failed`，但 invoke malformed-output path 仍未接入 shared taxonomy；Codex / GitHub Copilot 已有对称 coverage。
   - 处理：补一条 Claude malformed invoke preserved-facts case。
3. `2.3`
   - 判定：**认可**
   - 证据：`non_zero_exit` 已在 harness 中声明为 required scenario class，但 shared runtime unit test 尚未通过 helper 行使该 taxonomy。
   - 处理：保留现有 exit-code 断言，并追加 shared taxonomy assertion。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（通过）
4. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（包含在 focused suite 中通过）
   - 说明：将错误的 `PROCESS_SIGNAL` fixture 改为真实 authored truth `NOT_SUPPORTED`，消除 fallback coercion 假绿。
2. `2.2`：已完成
   - 变更文件：`packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - 验证：`pnpm exec vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（包含在 focused suite 中通过）
   - 说明：新增 Claude invoke no-response failure path 的 preserved-facts 断言，补齐 invoke-side taxonomy coverage。
3. `2.3`：已完成
   - 变更文件：`packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`（包含在 focused suite 中通过）
   - 说明：将 `non_zero_exit` 失败路径接入 shared taxonomy helper，同时保留原有 exit-code 断言。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 3 条 accepted finding 已全部修复，并通过同窗口 `pnpm run build`、focused vitest 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. sprint 仍需再走一轮 fresh reviewer recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
