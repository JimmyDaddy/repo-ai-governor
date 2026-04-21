# Code Review: sprint-002 executable acp_exec baseline delegated review round 1

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
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
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-protocol.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-session-runtime.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/adapter-routing-runtime.test.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`

## 2. Findings
### 2.1 [P1] Failed ACP executions poison same-key retries with stale rejected state
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 当前 shared prompt-turn execution 在 cancel/failure 终态后仍可能让同一 `processId/executionId/stageId/routeKey` 复用旧的 rejected `resultPromise` 与 failed terminal event buffer。这样下一次 `invokeStage()` 虽然看起来是 retry，但 transport owner 读到的仍是上一轮失败残留，而不是一条新的 ACP execution。
- 影响: retry path 会被 stale cache 污染，同 key turn 无法自恢复，shared invocation store 也会把失败态误当作仍可复用的 canonical turn truth。
- 建议: 对 failed/cancelled execution 执行 cache eviction，并在同 key retry 前清空 failed invocation buffer / `invokeResultPromise`；同时补一条回归测试锁住“先 cancel 再 retry”路径。

### 2.2 [P2] ACP probe contract still under-reports the shipped local cancellation semantics
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-host-protocol.ts`
- 问题描述: 当前 host operation 已经能解析 live invocation 并对 shared ACP prompt turn 执行本地取消，但 `probe()` 仍把 cancellation capability 宣称为 `unsupported`，health-check 的 `requestCancellationMode` 也还是 `not_supported`。
- 影响: verification / onboarding / diagnostics 会继续投射错误的 cancellation truth，既不符合实际行为，也会误导后续 route capability judgment。
- 建议: 把 ACP cancellation truth 调整为与当前实现一致的保守语义，例如 capability=`degraded`、`requestCancellationMode=local_abort_only`，并同步更新 consumer-facing projection tests。

### 2.3 [P2] New ACP lifecycle strings bypass the i18n bridge
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 新增的 ACP start/cancel/result 文案直接写成单语言字符串，没有统一经由 `localizeText(...)` 进入 shared i18n bridge。
- 影响: 这会直接违反 `CS-033`，并让 zh-CN routing / doctor / test surfaces 出现中英混杂的 lifecycle copy。
- 建议: 将所有新增的用户可见 ACP 文案都改为 `localizeText(english, chinese)`，并同步更新 localized routing/runtime 断言。

## 3. Notes
1. 当前 round 的 actionable findings 都集中在 sprint-002 新引入的 ACP execution ownership / probe truth / i18n 文案面，没有发现需要把 ACP path 回退为 `cli_exec` alias 的证据。
2. `requestConfirmation()` 仍维持 fail-closed，这属于 sprint-003 之后的 hardening 范围，不是本轮 finding。

## 4. Verification
1. reviewer 复用了当前实现窗口的绿色证据：`pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. reviewer 复用了当前实现窗口的绿色证据：`pnpm exec tsc -p tsconfig.json --noEmit`
3. reviewer 复用了当前实现窗口的绿色证据：`pnpm run build`
4. reviewer 复用了当前实现窗口的绿色证据：`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CliAcpTransportClientRuntime` 确实在 failed/cancelled 终态后保留了 shared invocation 的 failed event buffer 与 rejected `resultPromise`，同 key 重试会沿用旧失败态。
   - 处理：接受，修复方向定为“failed/cancelled 终态执行 cache eviction + retry 前 failed invocation reset”，并补一条 cancel-then-retry regression test。

2. `2.2`
   - 判定：**认可**
   - 证据：`CliAcpHostOperationRuntime.cancel()` 已经能解析 live invocation 并触发 transport-scoped local cancellation，但 `CliAcpHostProtocol.probe()` 仍返回 `cancellation.supportsCancel=false` 与 `requestCancellationMode=not_supported`。
   - 处理：接受，调整 ACP probe cancellation truth 为保守但真实的 `degraded + local_abort_only`，并同步 verification/onboarding/diagnostics projection coverage。

3. `2.3`
   - 判定：**认可**
   - 证据：ACP start/cancel/result copy 直接硬编码在 transport runtime 内，routing 测试在 zh-CN localizer 下已经暴露出 punctuation / locale drift。
   - 处理：接受，统一改为 `localizeText(english, chinese)`，并同步 localized runtime assertions。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec tsc -p tsconfig.json --noEmit`（通过）
   - 说明：failed/cancelled ACP turn 现在会在 retry 前清空 failed invocation state，并补上 same-key cancel-then-retry regression coverage，避免 shared execution cache 污染重试路径。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-host-protocol.ts`、`apps/cli/test/runtime/adapter-verification-runtime.test.ts`、`apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：ACP probe 现已把 cancellation 能力声明为 `degraded`，health-check / verify / onboarding 投影也统一到了 `local_abort_only`。

3. `2.3`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：新增 ACP lifecycle/result copy 已统一收敛到 `localizeText(english, chinese)`，routing/runtime localized assertions 也已改为匹配真实 locale 输出。

## 处置结果与剩余风险

1. CR-001 的 3 条 accepted findings 已全部修复，并完成 targeted vitest、root `tsc --noEmit`、sprint-002 baseline vitest、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 复验。
2. 当前剩余风险仅是 sprint-003 预留范围：permission / terminal / filesystem bridge 仍待在下一 sprint 做 capability-gated hardening；这不阻断 sprint-002 当前轮次 CR 收口。
