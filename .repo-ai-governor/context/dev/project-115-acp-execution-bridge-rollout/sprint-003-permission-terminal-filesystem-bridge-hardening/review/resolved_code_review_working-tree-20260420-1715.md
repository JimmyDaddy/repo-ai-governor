# Code Review: sprint-003-permission-terminal-filesystem-bridge-hardening

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent delegated reviewer loop
- Task: `CR-001`
- Review Type: delegated sprint recheck
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
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
2. `apps/cli/src/runtime/cli-acp-session-runtime.ts`
3. `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
4. `apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
5. `apps/cli/test/runtime/cli-acp-session-runtime.test.ts`

## 2. Findings
### 2.1 [P1] Confirmation bridge accepted forged tool-call ids on any live ACP turn
- 位置: `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: `requestPermission()` 只校验 live invocation 与 metadata 结构，却没有确认 `metadata.toolCallId` 是否属于当前 prompt turn 真正发出的 tool call。该问题违反 sprint-003 对 active tool-call confirmation mapping 的边界，属于风险推断但直接对应当前 sprint/task/ADR 中的 bridge truth。
- 影响: 任意 live ACP turn 都可能被伪造 confirmation metadata 误批准，导致 permission bridge 对 forged tool-call reference fail-open。
- 建议: 在 invocation state 中记录当前 turn 实际发出的 `toolCallId`，并在 confirmation bridge 中强制校验引用命中当前 live turn。

### 2.2 [P2] Unknown `fs/*` carriers bypassed the filesystem fail-closed gate
- 位置: `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: `resolveDefaultFixtureToolCallCapabilities()` 只对 `fs/read_text_file` 与 `fs/write_text_file` 映射 capability；其它 `fs/*` 会落成空 capability 列表并继续执行。该问题同样属于 sprint-003/ADR 规定的 fail-closed 边界缺口。
- 影响: 未声明支持的 filesystem carrier 仍会以成功路径继续流转，制造 filesystem bridge 已就绪的假象。
- 建议: 对未知 `fs/*` carrier 直接 fail-closed，或统一映射到显式 capability gate，而不是默认放行。

### 2.3 [P2] Default tool-call detail text skipped the i18n layer
- 位置: `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
- 问题描述: 当 tool-call payload 未提供 `detail` 时，runtime 直接生成英文 fallback 文本。该内容会通过 stream event 对用户可见，违反 `CS-033` 的 user-facing text i18n 约束。
- 影响: 本地化 shell / transcript 流中会出现英语硬编码 detail，破坏 CLI i18n truth。
- 建议: 默认 detail 必须通过 `localizeText(english, chinese)` 生成。

## 3. Notes
1. P1/P2 的 bridge ownership 与 fail-closed 判断主要依据 sprint-003 task/sprint goal、技术方案草案和正式 ADR；i18n 相关问题直接受 `CS-033` 约束。
2. 后续 delegated recheck 还收敛了 7 条 follow-up findings：unknown `fs/*` + explicit `requiredCapabilities` 绕过 fail-closed、permission-request replay fact mismatch、partial emission 后的 interrupted cleanup、default permission reason i18n、cached permission-resolution cleanup coverage、malformed fixture payload detail i18n，以及 cancel ACK 之后的 late confirmation fail-closed。
3. final delegated reviewer `Averroes` 明确返回 `No actionable findings.`，当前 sprint-003 hardening 面已 reviewer-clean。
4. 当前 review 仅覆盖 sprint-003 新增 ACP permission/tool-call/cancel hardening 面；真实 provider / packaged distribution 证据仍由 sprint-004 与 sprint-005 继续收口。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`（通过）
4. `pnpm run build`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-20）

- 整体结论：**通过**

### 逐条复核
1. `2.1` 与 permission-bridge follow-up findings
   - 判定：**认可**
   - 证据：confirmation 现在要求 active、未取消、未 settled 的 live invocation，且 `toolCallId` 必须命中当前 turn 真正发出的 tool call；同一 `acpPermissionRequestId` 也会绑定稳定 confirmation facts，并在 cancel ACK 后对 late confirmation fail-closed。
   - 处理：已在 `CliAcpTransportClientRuntime`、`CliAcpHostOperationRuntime`、`CliAcpSessionRuntime` 以及 `cli-acp-prompt-turn-runtime.test.ts` / `cli-acp-session-runtime.test.ts` 中补齐实现与回归覆盖。
2. `2.2`
   - 判定：**认可**
   - 证据：unknown `fs/*` carriers 现在直接 fail-closed；即使 payload 显式提供 `requiredCapabilities`，也不能绕过 carrier validation。
   - 处理：已在 `CliAcpTransportClientRuntime` 中收紧 filesystem carrier gating，并补齐 unknown carrier rejection coverage。
3. `2.3` 与 i18n follow-up findings
   - 判定：**认可**
   - 证据：default tool-call detail、default permission reason、malformed fixture tool-call payload error details 都已通过 `localizeText(...)` 生成，不再泄漏英语 fallback。
   - 处理：已补中文 locale 断言，覆盖 default detail 与 malformed payload rejection path。
4. interrupted lifecycle cleanup follow-up findings
   - 判定：**认可**
   - 证据：interrupted turns 现在会清空 emitted tool calls、terminal ids、permission request ids 与 cached permission resolutions；partial-emission failure、confirmed-turn cancel cleanup 都有 scoped regression coverage。
   - 处理：已补 interrupted cleanup helper 与对应 tests，确保 carrier / permission cache 不会跨 turn 泄漏。
5. final delegated reviewer (`Averroes`)
   - 判定：**通过**
   - 证据：fresh delegated recheck 明确返回 `No actionable findings.`，并本地复跑 `pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts` 为 `31/31` 通过。
   - 处理：当前 CR 生命周期推进为 `resolved`，sprint-003 进入 closeout / sprint-004 activation window。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`（通过）
2. `pnpm exec tsc -p tsconfig.json --noEmit`（通过）
3. `pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`（通过）
4. `pnpm run build`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. confirmation bridge binding / permission replay / cancel ACK late-confirmation guard：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`、`apps/cli/src/runtime/cli-acp-session-runtime.ts`、`apps/cli/src/types/interfaces/cli-acp-host-runtime.interface.ts`、`apps/cli/src/types/index.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`、`apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`、`pnpm exec tsc -p tsconfig.json --noEmit`、`pnpm run build`
   - 说明：permission bridge 现在只接受 active tool-call metadata 对应的 live turn，并对 replay / cancel windows 保持 fail-closed。
2. filesystem carrier validation / capability-gated fail-closed：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：unknown `fs/*` carriers 与显式 `requiredCapabilities` 绕过路径都已收紧为 fail-closed。
3. user-facing i18n fixes for tool-call and fixture payload errors：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`、`pnpm run build`
   - 说明：default tool-call detail、default permission reason 与 malformed fixture payload detail 不再泄漏英语 fallback。
4. interrupted-turn carrier / permission cache cleanup：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`、`apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/cli-acp-prompt-turn-runtime.test.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：partial-emission failure、confirmed-turn cancel cleanup 与 cached permission-resolution cleanup 现在都由 regression coverage 固定下来。

## 处置结果与剩余风险

1. `CR-001` 已 reviewer-clean；sprint-003 现在满足 closeout gate 与 sprint-004 activation handoff 条件。
2. 唯一剩余限制是当前证据仍以 fixture-driven ACP bridge 为主，真实 provider / packaged distribution 证据继续由 sprint-004 与 sprint-005 收口。
