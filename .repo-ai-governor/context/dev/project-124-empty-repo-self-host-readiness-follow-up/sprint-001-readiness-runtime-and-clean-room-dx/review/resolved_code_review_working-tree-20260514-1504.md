# Code Review: TK-1065 legacy self-host verify-summary compatibility recheck

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated fresh reviewer round
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/cli-governance-runtime.integration.test.ts`

## 2. Findings
### 2.1 [P2] Legacy self-host verify summaries are not covered by the new run preflight contract
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:2100`
- 问题描述: 当前 runtime 已实现“canonical summary 缺失 `executionPreflight*` 字段时回退到 activation-phase 记录重建 blocked truth”的兼容分支，但新增集成测试只覆盖了包含这些字段的新 summary 形状，没有压到 legacy self-host verify summary 的 fallback path。
- 影响: 已升级的 self-host 仓库若仍持有旧版 `adopt verify` summary，可能在没有回归测试的情况下偏离预期的 fail-closed / diagnostic dry-run contract。
- 建议: 补充 legacy summary shape 的 run 集成覆盖，验证 `run --dry-run --trace` 仍可 warn-only，普通 dry-run 与 task-driven run 仍 fail-closed。

## 3. Notes
1. 本轮 fresh reviewer 未发现第二条 actionable finding。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（主 agent 已执行）
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（主 agent 已执行）
3. `pnpm run build`（主 agent 已执行）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`resolveSelfHostExecutionPreflight()` 已包含 legacy summary fallback，但原有 run 集成用例全部经由包含 `executionPreflightSignal / executionPreflightBlockedGroups / executionPreflightPlaceholderPaths` 的 fixture 进入。
   - 处理：接受并补充 legacy summary shape 的 self-host blocked run coverage，覆盖 diagnostic dry-run、non-trace dry-run 与 task-driven run 三条行为分支。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：为 blocked self-host verification fixture 增加 legacy summary shape 模式，并新增 3 条兼容回归测试，确保 fallback path 仍满足 `run --dry-run --trace` warn-only、其余路径 fail-closed 的 contract。
