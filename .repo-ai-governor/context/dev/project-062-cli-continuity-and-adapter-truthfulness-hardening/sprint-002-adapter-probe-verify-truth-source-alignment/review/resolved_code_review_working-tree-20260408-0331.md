# Code Review: sprint-002-adapter-probe-verify-truth-source-alignment round 1

- Status: resolved
- Date: 2026-04-08
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
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/**`
5. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/plan.md`
6. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/plan.md`
7. `.repo-ai-governor/context/current-context.md`

## 2. Findings

### 2.1 [P2] `tool_matrix` fallback rows still mix selected-tool truth with rejected-route failure reasons

- 位置:
  - `apps/cli/src/runtime/agent-onboarding-runtime.ts:164`
  - `apps/cli/src/runtime/agent-onboarding-runtime.ts:181`
  - `apps/cli/src/runtime/adapter-verification-runtime.ts:101`
  - `apps/cli/src/runtime/adapter-verification-runtime.ts:157`
  - `apps/cli/test/runtime/agent-onboarding-runtime.test.ts:415`
- 问题描述: `tool_matrix.availability_status` 已改为 selected tool 的 probe snapshot，但同一行的 `invoke_liveness_diagnostics` 仍直接复用 `roleEvaluation.unavailableReasons` / `failureAttributions`。在 fallback 场景下，这些 role-level reasons 会携带被拒绝主链路的故障信息，导致同一行同时出现 “selected tool = available” 和 “diagnostics = primary route unavailable” 的混合真值。
- 影响: 这会把 sprint-002 想冻结的 tool truth 与 binding truth 再次混写，operator 仍可能把 fallback row 误解为 selected tool 自身故障。
- 建议: 让 `tool_matrix` 的 tool diagnostics 仅消费 selected tool 的 probe snapshot，并把 role-level binding reasons 显式拆到独立字段或 role-binding surface。

### 2.2 [P3] `resolveFallbackAvailabilityStatus()` 复写了治理状态字面量

- 位置:
  - `apps/cli/src/runtime/agent-onboarding-runtime.ts:321`
  - `apps/cli/src/constants/cli-governance-runtime.constant.ts:6`
- 问题描述: 新 helper 直接比较 `'fail'` / `'warn'` 字符串，而没有复用 `CliGovernanceCheckStatus` 常量枚举。
- 影响: 这会绕开仓库对集中常量的治理要求，后续如果状态枚举演进，这里更容易发生静默漂移。
- 建议: 改为使用 `CliGovernanceCheckStatus.FAIL/WARN`。

## 3. Notes

1. delegated reviewer round `CR-001` 返回 2 条 actionable finding，主 agent 需要复核后再推进 `verified/resolved` 生命周期。

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，review 前基线）
2. `pnpm run build`（通过，review 前基线）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，review 前基线）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过，review 前基线）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过，review 前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，review 前基线）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过，review 前基线）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，review 前基线）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`tool_matrix.availability_status` 已切到 selected tool probe truth，但 `invoke_liveness_diagnostics` 仍复用 `roleEvaluation.unavailableReasons` / `failureAttributions`，fallback 行会同时出现 “selected tool available” 与 “primary route unavailable” 的混合诊断，确实破坏了当前 sprint 想冻结的 truth-source boundary。
   - 处理：把 tool-level diagnostics 改为仅消费 selected tool snapshot，并把 binding-level reasons 显式拆到独立字段。
2. `2.2`
   - 判定：**认可**
   - 证据：`resolveFallbackAvailabilityStatus()` 直接比较 `'fail'` / `'warn'`，没有复用 `CliGovernanceCheckStatus` 常量枚举，和仓库对集中常量的治理要求不一致。
   - 处理：改为使用 `CliGovernanceCheckStatus.FAIL/WARN`。

### 验证命令

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`tool_matrix` 现在把 selected tool 的 `availability_status` 与 `invoke_liveness_diagnostics` 绑定到同一 probe snapshot，同时新增 binding-level reasons 字段承载 fallback route 的 rejected-surface 诊断。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：fallback availability helper 已改为复用 `CliGovernanceCheckStatus` 枚举，不再复制字面量状态值。
