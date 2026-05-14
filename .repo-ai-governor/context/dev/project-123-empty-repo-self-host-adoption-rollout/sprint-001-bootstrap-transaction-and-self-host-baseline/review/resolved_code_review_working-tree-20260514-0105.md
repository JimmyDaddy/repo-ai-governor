# Code Review: sprint-001 bootstrap transaction and self-host baseline

- Status: resolved
- Date: 2026-05-14
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
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/config/src/default-governor-config.ts`
2. `packages/standards/src/self-host-governor-config.ts`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/cli-governance-runtime.ts`
5. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
6. `apps/cli/test/adopt-command.integration.test.ts`
7. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/**`

## 2. Findings
### 2.1 [P2] self-host config seed duplicated the adapters/routing/tools baseline and had already drifted from the CLI default
- 位置: `packages/standards/src/self-host-governor-config.ts:1`
- 问题描述: self-host helper hardcoded a second full `adapters` baseline while `apps/cli/src/main.ts` and `apps/cli/src/cli-governance-runtime.ts` kept separate defaults. Reviewer primary surface had already diverged between the two paths.
- 影响: empty-repo self-host bootstrap could write one config truth while the active CLI fallback/runtime expected another, which risks bootstrap/apply drift and breaks the planned sprint-002 ownership/drift work.
- 建议: centralize the default adapters/governor config baseline and make self-host/bootstrap/init consumers render from the same source.

### 2.2 [P2] bootstrap-to-connect regression did not prove the managed install stayed clean after connect rewrote `governor.yaml`
- 位置: `apps/cli/test/adopt-command.integration.test.ts:655`
- 问题描述: the new onboarding regression stopped after `connect` succeeded, so it did not prove `adopt diff` or `adopt verify` stayed clean after the repo-local config was rewritten.
- 影响: a first-run flow could look healthy during onboarding but still leave the managed receipt in drift immediately afterward.
- 建议: extend the regression to run a managed lifecycle check after `connect` and assert no drift remains.

## 3. Notes
1. 本轮 reviewer 提供了 2 个 actionable findings，均被接受并在同一 change window 中修复。
2. 修复未改动 adopter-facing docs truth，仍保持在 sprint-004 clean-room evidence 完成前不抢跑 public support truth。

## 4. Verification
1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ".repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id CR-001`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`packages/config/src/default-governor-config.ts` 新增 canonical default adapters/governor config builder，`main/init/bootstrap/self-host` 改为统一消费这份 baseline。
   - 处理：已接受并修复，消除了 self-host helper 与 CLI fallback defaults 的多源漂移。

2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/test/adopt-command.integration.test.ts` 在 `connect` 成功后追加 `adopt diff --repo .`，并断言 diff report `records=[]` 且 `verificationSummary.driftDetected=false`。
   - 处理：已接受并修复，补齐 managed cleanliness 回归覆盖。

### 验证命令
1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`packages/config/src/default-governor-config.ts`、`packages/config/src/index.ts`、`packages/standards/src/self-host-governor-config.ts`、`apps/cli/src/main.ts`、`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：抽取 shared default adapters/governor config builder 与 stable YAML renderer，使 bootstrap/init/runtime/self-host install 共用一份 canonical baseline。

2. `2.2`：已完成
   - 变更文件：`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
   - 说明：新增 `connect` 后 `adopt diff` clean assertion，证明 managed install 在 first-run onboarding 后仍保持无 drift。
