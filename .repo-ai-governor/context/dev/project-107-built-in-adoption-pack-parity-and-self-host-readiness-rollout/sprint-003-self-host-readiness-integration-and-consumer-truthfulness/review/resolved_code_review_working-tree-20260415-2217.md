# Code Review: project-107 final delegated round 3

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: project-final delegated review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `packages/standards/src/built-in-adoption-pack-catalog.ts`
2. `packages/standards/src/adoption-pack-registry.ts`
3. `packages/standards/src/standards-runtime-loader.ts`
4. `apps/cli/src/runtime/adoption-pack-runtime.ts`
5. `apps/cli/src/commands/doctor-command.ts`
6. `apps/cli/test/adopt-command.integration.test.ts`
7. `packages/standards/test/adoption-pack-registry.unit.test.ts`
8. `README.md`
9. `docs/local-adoption-playbook.md`
10. `docs/support-matrix.md`

## 2. Findings
### 2.1 [P1] Self-host readiness never reaches doctor diagnostics
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts`, `apps/cli/src/commands/doctor-command.ts`, `packages/standards/src/built-in-adoption-pack-catalog.ts`
- 问题描述: readiness matrix 已把 `doctor_diagnostics` 声明为 self-host readiness sink，但当前实现只在 `adopt verify` 中消费这些 facts；fresh `self-host-complete + repo_local` 安装可以在 `adopt verify` 看到 `self-host-readiness:*` 与 `self-host-execution-preflight`，`doctor --output json` 却没有同类 check。
- 影响: project-107 的公开 readiness surface 出现 contract drift，`doctor diagnostics` 与 `adopt verify` 会对同一批 starter placeholders 给出不一致的 readiness truth。
- 建议: 把同一套 self-host readiness checks 路由到 `doctor` command result / diagnostics artifact，并增加 doctor-path integration coverage 锁住该 contract。

## 3. Notes
1. 本轮 project-final review 发现 1 条 actionable finding；在该问题收口前，`TK-899` 不得进入 final closeout claim。

## 4. Verification
1. reviewer 使用 code inspection + fresh self-host CLI repro 复核 `doctor --output json` 与 `adopt verify` 的差异。
2. reviewer 未重跑 full `pnpm run check/build/test` matrix；主 agent 需在修复后补齐同窗口 build/test/gate evidence。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/adoption-pack-runtime.ts` 现已对外暴露 doctor-facing self-host readiness checks；`apps/cli/src/commands/doctor-command.ts` 现已将同源 readiness facts 写入 doctor checks / diagnostics artifact；`apps/cli/test/adopt-command.integration.test.ts` 新增 fresh `self-host-complete + repo_local` doctor-path assertion，证明 `doctor --output json` 与 `adopt verify` 对 readiness warning / `self-host-execution-preflight` 保持一致。
   - 处理：接受并通过 runtime routing + doctor command consumption + CLI integration coverage 完成修复。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

### 风险与后续
1. 本轮只补齐了 fresh self-host starter placeholder 的 doctor-path readiness truth；若后续需要把 authored-ready inverse branch 提升为单独 contract evidence，可在 follow-up window 再补更细的 re-author / clear-warning test。

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/src/commands/doctor-command.ts`、`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
   - 说明：doctor command 现已消费与 `adopt verify` 同源的 self-host readiness facts，并把 warning / `self-host-execution-preflight` 一并写入 command result 与 diagnostics artifact；CLI integration test 也已锁住 doctor-path contract。

## 处置结果与剩余风险
1. round 3 的 accepted project-final finding 已完成修复并复验通过。
2. 当前仍需一个 fresh project-final clean recheck round，确认修复后的 branch delta 没有新增 actionable findings 后，`TK-899` 才能进入正式 closeout。
