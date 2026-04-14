# Code Review: sprint-001 additive diagnostics consumer rollout

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
1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
3. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`

## 2. Findings
### 2.1 [P1] `launch_diagnostics` bypasses the canonical `enabled_tools[]` carrier
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:345`
- 问题描述: round-1 implementation 只在 `tool_transport_matrix` compatibility alias 上 materialize `launch_diagnostics`，而 `enabled_tools[]` canonical row 仍未携带该 companion。这样会让 canonical consumer 与 compatibility alias 看到两套不同的 machine-readable truth。
- 影响: onboarding contract 要求 `tool_transport_matrix` 只能机械派生自 `enabled_tools[]`；如果 additive `launch_diagnostics` 只出现在 alias 上，canonical consumer 会丢失 `selected_entrypoint / request_cancellation_mode / shell_wrapped / process_tree_policy / spawn_error_code` 的统一投影，形成 contract drift。
- 规范依据:
  - `agent-onboarding-contract.md` §4.14
  - `agent-onboarding-contract.md` §4.17
  - `agent-onboarding-contract.md` §5.10
- 建议: 先把 `launch_diagnostics` 作为 optional companion materialize 到 `enabled_tools[]`，再由 `tool_transport_matrix` 直接复用 row-level projected truth，避免 alias 单独重算。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 1；main agent 已对该 finding 做逐条复核并完成 accepted-finding 修复。
2. 本轮只处理 `launch_diagnostics` canonical carrier drift；命令级 JSON 序列化路径的 clean recheck 结果另记入 `resolved_code_review_working-tree-20260414-1755.md`。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`tool_transport_matrix` 必须机械派生自 `enabled_tools[]`，而 additive `launch_diagnostics` 正式 contract 也允许稳定挂载在 `enabled_tools[]` canonical row。若只在 alias materialize，会让 canonical 与 compatibility consumer 看到不同 truth。
   - 处理：已接受，修复为先在 `createEnabledToolRowsPayload()` 投影 `launch_diagnostics`，再让 `createToolTransportMatrixPayload()` 直接复用 `row.launch_diagnostics`。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：`launch_diagnostics` 已先 materialize 到 `enabled_tools[]` canonical carrier，并在 onboarding + verify payload 中断言与 `tool_transport_matrix` alias parity；`tool_transport_matrix` 不再拥有独立于 canonical row 的 launch truth。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 accepted finding 已全部修复，并通过 focused runtime suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. 最新 round 的 clean recheck 结果另记入 `resolved_code_review_working-tree-20260414-1755.md`；只有该 round 也 clean，sprint 才能进入 closeout。
