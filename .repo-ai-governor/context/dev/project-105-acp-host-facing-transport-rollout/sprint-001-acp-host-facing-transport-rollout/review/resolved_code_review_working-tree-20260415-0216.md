# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-003`
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
### 2.1 [P2] ACP onboarding payload drifts from provider-field contract
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:620`
- 问题描述: `acp_exec` path 在保留 `transport_kind=acp_exec` 的同时，把 `provider_kind / vendor_binding_kind / model` 清成了 `null`。但同一 tool row 仍携带 `configured_remote_api`，而 onboarding contract 明确要求只有 `baseline / cli_exec` row 才允许这些 provider fields 为 `null`。
- 影响: `enabled_tools[]` 和 `tool_transport_matrix` 的稳定 contract shape 被破坏，consumer 会把 ACP row 错误解读成“没有 provider/binding/model truth”的 surface。
- 规范依据:
  - `agent-onboarding-contract.md` §4.8
  - `agent-onboarding-contract.md` §5.5
- 建议: 保留 `acp_exec` 作为 canonical transport truth，但继续投影同一 tool row 已配置的 remote-api provider / vendorBinding / model。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 3；main agent 已复核并接受该 finding。
2. reviewer 没有在 scoped surface 中发现第二条 actionable issue。
3. 本文件只记录 round-3 finding 修复与验证结果；sprint closeout 仍取决于下一轮 fresh reviewer 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 `enabled_tools[]` 对 `acp_exec` row 保留了 `configured_remote_api` companion，却把 `provider_kind / vendor_binding_kind / model` 置空，这和 onboarding contract 里“只有 `baseline / cli_exec` row 才允许这些字段为 `null`”的约束相冲突。
   - 处理：已接受，改为在 `acp_exec` 场景继续投影 configured remote-api provider / vendorBinding / model，同时保持 `transport_kind=acp_exec` 不变。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：ACP onboarding payload 现在会在 `transport_kind=acp_exec` 的同时保留 configured remote-api provider/binding/model，恢复到现有 onboarding contract 允许的 machine-readable shape。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-003` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
