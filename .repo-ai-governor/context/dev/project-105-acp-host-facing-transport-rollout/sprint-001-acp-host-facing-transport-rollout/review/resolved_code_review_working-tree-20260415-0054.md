# Code Review: sprint-001 acp host-facing transport rollout

- Status: resolved
- Date: 2026-04-15
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`

## 2. Findings
### 2.1 [P2] ACP fail-closed RuntimeError path emits hardcoded English copy
- 位置: `apps/cli/src/runtime/cli-acp-host-protocol.ts:189`
- 问题描述: `CliAcpHostProtocol#createUnavailableError()` 直接构造英文错误文案。`acp_exec` 在 rollout enablement 完成前会经由 `invoke` / `stream` / `confirm` fail-closed 抛出这个错误，因此它属于新的用户可见 CLI 路径。
- 影响: 非英文 locale 会看到混合语言输出，违反 `CS-033` 对 `apps/**` 用户可见文案必须经过项目 i18n/localizeText bridge 的要求。
- 规范依据:
  - `CS-033`
- 建议: 通过现有 CLI `localizeText(english, chinese)` bridge 注入文案，并补一条面向 `acp_exec` fail-closed message 的直接测试。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 1；main agent 已复核并接受该 finding。
2. reviewer 还提示 non-Codex ACP surface 的显式 coverage 仍偏薄，但当前 shared routing 分支与现有 smoke 已足以支撑其作为 residual note，不单独升级为本轮 actionable finding。
3. 本文件只记录 round-1 finding 修复与验证结果；sprint 是否允许 closeout 仍取决于下一轮 fresh reviewer recheck 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`createUnavailableError()` 原先直接内联英文文案，且该路径会在 `acp_exec` transport 的 `invoke` / `stream` / `confirm` fail-closed 场景中向 CLI 用户暴露，符合 `CS-033` 的用户可见文本范围。
   - 处理：已接受，改为通过 `localizeText(english, chinese)` bridge 生成文案，并把 bridge 由 `CliAdapterRoutingRuntime` 继续向 `CliGovernanceRuntime` 与 `CliSessionMainSupervisorRuntime` 注入。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-host-protocol.ts`、`apps/cli/src/runtime/adapter-routing-runtime.ts`、`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：ACP fail-closed RuntimeError 现已通过 routing-owned `localizeText` bridge 输出本地化文案，并新增直接断言，覆盖 `acp_exec` `invokeStage` 的本地化错误消息。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-001` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
