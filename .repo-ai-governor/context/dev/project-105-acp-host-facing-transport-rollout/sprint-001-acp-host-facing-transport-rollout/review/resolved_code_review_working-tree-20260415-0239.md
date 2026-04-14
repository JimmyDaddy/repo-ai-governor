# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-004`
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
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
6. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
7. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`

## 2. Findings
### 2.1 [P2] ACP onboarding row still erases selector truth
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:679`
- 问题描述: `acp_exec` onboarding row 现在已经保留 `provider_kind / vendor_binding_kind / model`，但 `resolveSelectedCredentialMode()` 与 `resolveSelectedEndpointSource()` 仍只在 `remote_api` transport 下返回选择结果，导致同一 row 在携带 configured remote-api companion 时继续把 `credential_mode` 与 `endpoint_source` 投影成 `null`。
- 影响: `enabled_tools[]` 与 `tool_transport_matrix` 会丢失 transport-aware selector truth，下游 consumer 无法区分 ACP surface 背后究竟是 env、credential-ref 还是 provider-local endpoint/config 路径，也就拿不到正确的 remediation hint。
- 规范依据:
  - `agent-onboarding-contract.md` §4.8
  - `agent-onboarding-contract.md` §5.5
- 建议: 对 `acp_exec` 复用同一 configured remote-api companion 的 selector disclosure guardrail，保留 `credential_mode` 与 `endpoint_source`，并补一条回归断言锁定该 row shape。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 4；main agent 已复核并接受该 finding。
2. reviewer 还提示 localized ACP fail-closed RuntimeError 缺少直接 runtime test，但当前 scoped surface 已由 routing/runtime tests 间接覆盖，暂不作为本轮 actionable finding。
3. 本文件只记录 round-4 finding 修复与验证结果；sprint closeout 仍取决于下一轮 fresh reviewer 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`acp_exec` onboarding row 会继续携带 configured remote-api companion，却仍把 `credential_mode` 与 `endpoint_source` 置空；这与 onboarding contract 对 transport-aware selector truth 的要求不一致。
   - 处理：已接受，改为让 `resolveSelectedCredentialMode()` 与 `resolveSelectedEndpointSource()` 复用 ACP disclosure guardrail，在 `acp_exec` 场景继续投影 configured remote-api selector truth。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：ACP onboarding row 现在会在 `transport_kind=acp_exec` 的同时保留 configured remote-api selector truth，恢复 `credential_mode` 与 `endpoint_source` 的 machine-readable projection。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-004` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
