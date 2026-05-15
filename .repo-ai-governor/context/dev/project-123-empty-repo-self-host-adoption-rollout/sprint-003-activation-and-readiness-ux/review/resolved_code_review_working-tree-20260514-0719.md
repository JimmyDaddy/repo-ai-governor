# Code Review: sprint-003 activation and readiness ux delegated recheck round 3

- Status: resolved
- Date: 2026-05-14
- Reviewer: Beauvoir
- Main Verifier: AI-Agent
- Task: `CR-003`
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
1. `apps/cli/src/commands/check-command.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings
### 2.1 [P2] `check` command still emitted hardcoded English user-facing strings
- 位置: `apps/cli/src/commands/check-command.ts`, `apps/cli/test/adopt-command.integration.test.ts`
- 问题描述: `config_source` details, `script_not_found`, fallback `passed`, plus success/failure summaries still bypassed locale-aware rendering, so `repo-ai-governor --locale zh-CN check` returned mixed-language operator text.
- 影响: self-host readiness UX looked partially localized while the governance `check` surface still violated `CS-033`, leaving the sprint-003 canonical readiness flow inconsistent for zh-CN operators.
- 建议: route all user-facing `check` summaries/details through `localizeText(...)` and add explicit zh-CN integration coverage for both success and failure paths.

## 3. Notes
1. 本轮 reviewer 只发现 `check-command` 剩余的 i18n 漏口；前两轮修复在当前 targeted 回归中持续通过。
2. 修复仍触及 `apps/**` 与 `test/**`，因此 `resolved` 结论附带同窗口真实 `pnpm run build` 证据。

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
   - 证据：`check-command.ts` 的 `config_source` detail、missing-script detail、fallback pass detail，以及 success/failure summary 现已统一走 `localizeText(...)`；integration tests 同时覆盖了 repo-local config、default config 和 zh-CN failure path。
   - 处理：accepted and fixed.

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/check-command.ts`, `apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run build`（通过）
   - 说明：`check` 的用户可见输出已在 `zh-CN` 下完成闭环，默认配置与 canonical verify fail path 也有显式 locale-aware 断言。
