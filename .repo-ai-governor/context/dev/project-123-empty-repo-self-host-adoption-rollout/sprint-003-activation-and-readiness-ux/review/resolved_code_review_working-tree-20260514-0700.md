# Code Review: sprint-003 activation and readiness ux delegated recheck round 2

- Status: resolved
- Date: 2026-05-14
- Reviewer: Huygens
- Main Verifier: AI-Agent
- Task: `CR-002`
- Review Type: delegated sprint boundary post-fix recheck
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
### 2.1 [P2] self-host readiness output bypassed CLI i18n
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts`, `apps/cli/test/adopt-command.integration.test.ts`
- 问题描述: self-host readiness detail strings and next-action guidance were emitted as English-only user-facing text, then surfaced through `adopt verify` / `doctor` / `check`.
- 影响: localized CLI users would receive mixed-language diagnostics and next-step guidance, violating `CS-033`.
- 建议: route readiness natural-language output through `localizeText(...)`, and add locale-aware test coverage so non-English output is explicitly exercised.

## 3. Notes
1. reviewer round 2 confirmed round 1 的两个修复仍然成立；本轮唯一新增问题是 i18n 合规性。
2. 本轮修复仍触及 `apps/**` 与 `test/**`，因此 `resolved` 结论附带同窗口真实 `pnpm run build` 证据。

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
   - 证据：self-host readiness 的 next-actions、phase summaries、preflight summaries 与 check/doctor surfaced detail 已改为 `localizeText(...)` 生成，同时新增 `zh-CN` 断言覆盖中文 next-action 输出。
   - 处理：accepted and fixed.

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`, `apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：self-host readiness 的用户可见文案已进入 locale-aware 路径，且 `check` 的 `zh-CN` 输出现已具备显式断言。
