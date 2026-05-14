# Code Review: TK-1066 self-host operator guidance and doctor canonical preflight replay

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-004`
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
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`

## 2. Findings
### 2.1 [P1] `doctor --adapters` did not replay canonical self-host preflight detail
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts`
- 问题描述: `doctor --adapters` 在回放 canonical `adopt verify` summary 时，没有消费新增的 `executionPreflightBlockedGroups / executionPreflightPlaceholderPaths`，而是继续退化成只读 `activationPhaseStatus/currentPhase` 的旧式 preflight 摘要。
- 影响: `run` 与 `adopt verify` 已经建立的 canonical self-host preflight truth，无法被 `doctor --adapters` 一致回放，operator 会继续看到不完整的 blocked groups / placeholder paths。
- 建议: `doctor` 优先消费 canonical `executionPreflight*` 字段，仅在旧 summary 形状缺字段时才回退到 activation-phase records 重建。

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
   - 证据：`buildDoctorReadinessChecksFromCanonicalSummary()` 确实仍只依赖 `activationPhaseStatus/currentPhase` 生成 preflight detail；在 `/Users/jimmydaddy/study/deepseekian` 的 real-target recheck 中，`doctor --adapters` 也只显示了退化后的 blocked summary。
   - 处理：接受并修复为优先消费 canonical `executionPreflightSignal / executionPreflightBlockedGroups / executionPreflightPlaceholderPaths`，仅在旧版 summary 缺字段时才回退到 activation-phase records。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --adapters --output json`（在 `/Users/jimmydaddy/study/deepseekian` 下通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/doctor/doctor-1778747842097.json`（通过）
   - 说明：`doctor --adapters` 现在会优先回放 canonical self-host preflight blocked groups 与 placeholder paths；只有在 legacy summary 缺少 `executionPreflight*` 字段时，才回退到 activation-phase records 重建。
