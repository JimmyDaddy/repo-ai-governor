# Code Review: sprint-001 acp host-facing transport rollout recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-002`
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
### 2.1 [P2][risk-based inference] ACP probe path drops config-level unavailability
- 位置: `apps/cli/src/runtime/adapter-routing-runtime.ts:327`、`apps/cli/src/runtime/cli-acp-host-protocol.ts:86`
- 问题描述: `CliAdapterRoutingRuntime` 在 `acp_exec` 分支构造 `CliAcpHostProtocol` 时只传了 `surfaceId` 与 `localizeText`，没有透传 config-derived `availabilityStatus / unavailableReasons`。结果 ACP protocol probe 会一律回落到 `acp_host_transport_not_ready`，把 `enabled=false` 或其他 config-blocked surface 误报成 rollout 未就绪。
- 影响: `CliSessionMainSupervisorRuntime` 这类直接消费 probe diagnostics 的 surface 会向用户暴露错误的 unavailable reason，破坏 ACP host-facing transport 的 truthfulness。
- 规范依据:
  - `acp-host-facing-transport-formalization-and-distribution-boundary.md` §2
  - `agent-onboarding-contract.md` §21
- 建议: 让 ACP protocol 优先保留 config-level unavailable metadata；只有在 surface 本身未被配置阻断时，才使用 baseline `acp_host_transport_not_ready` reason。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 2；main agent 已复核并接受该 finding。
2. reviewer 没有发现第二条 actionable issue；其余关于 `session.main` 构造路径覆盖仍偏薄的观察保留为 residual note。
3. 本文件只记录 round-2 finding 修复与验证结果；sprint closeout 仍取决于下一轮 fresh reviewer 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`acp_exec` 的 protocol probe 之前没有消费 routing-runtime 已经解析出的 config unavailability，因此 disabled/config-blocked surface 无论实际原因是什么，都会统一生成 `protocol.health_check_failed:...acp_host_transport_not_ready`。
   - 处理：已接受，改为把 `availabilityStatus / unavailableReasons` 从 routing-runtime 透传到 ACP protocol，并在 probe resolution 中优先保留 config-derived unavailable truth。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-host-protocol.ts`、`apps/cli/src/runtime/adapter-routing-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：ACP protocol probe 现在会在 config-disabled/config-blocked 场景保留 config-derived unavailable reasons；只有真正落到 baseline rollout guardrail 时才回报 `acp_host_transport_not_ready`。同时新增 disabled `acp_exec` surface 的回归断言。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-002` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
