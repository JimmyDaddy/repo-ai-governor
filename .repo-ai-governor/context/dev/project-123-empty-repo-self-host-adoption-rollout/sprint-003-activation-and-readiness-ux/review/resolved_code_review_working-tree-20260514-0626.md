# Code Review: sprint-003 activation and readiness ux delegated review round 1

- Status: resolved
- Date: 2026-05-14
- Reviewer: Bacon
- Main Verifier: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint boundary review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/src/commands/check-command.ts`
3. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings
### 2.1 [P1] `check` dropped canonical verify failures and could exit `0`
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:2389`, `apps/cli/src/commands/check-command.ts:83`
- 问题描述: `collectCheckReadinessChecks()` only re-emitted activation-phase summary rows from the canonical verify output and discarded existing `fail` rows plus the overall canonical fail state.
- 影响: a self-host workspace with already-recorded verify failures could still pass `repo-ai-governor check`, producing a false-green governance audit.
- 建议: preserve canonical verify `fail` rows when `check` consumes readiness truth, and fail `check` when the canonical verify summary is already failed.

### 2.2 [P2] `adapter_connected` treated any `connect apply` receipt as current
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:1907`
- 问题描述: readiness evaluation only checked whether a `connect-apply-*.json` file existed, without validating `applyReady`, `applyBlockers`, `candidateFingerprintCurrent`, or whether `appliedConfigHash` still matched the current `governor.yaml`.
- 影响: stale receipts, forced apply output, or later config drift could incorrectly keep `adapter_connected=completed` and unblock later readiness phases.
- 建议: validate the latest apply receipt against current config hash and receipt readiness fields before marking `adapter_connected` complete.

## 3. Notes
1. 本轮 findings 均已被主 agent 认可并修复。
2. 该 review 面触及 `apps/**` 与 `test/**`，因此 `resolved` 结论附带了同窗口真实 `pnpm run build` 证据。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run build`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`buildCheckReadinessChecksFromCanonicalSummary()` now carries canonical `fail` rows forward and `CliCheckCommand` still promotes those rows to failing governance checks.
   - 处理：accepted and fixed.
2. `2.2`
   - 判定：**认可**
   - 证据：self-host readiness now validates the latest `connect apply` receipt against `applyReady`, `candidateFingerprintCurrent`, empty `applyBlockers`, and current `governor.yaml` hash parity.
   - 处理：accepted and fixed with integration coverage for post-apply config drift.

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`, `apps/cli/src/commands/check-command.ts`, `apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：`check` 现在保留 canonical verify fail rows，并在 canonical verification summary 已失败时 fail-closed。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`, `apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：`adapter_connected` 仅在最新 `connect apply` receipt 仍然 apply-ready 且与当前 `governor.yaml` 哈希一致时才保持 completed。
