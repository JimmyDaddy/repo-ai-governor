# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-005`
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

1. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 2. Findings

### 2.1 [P2] Workspace-operation failures bypassed the repo i18n path
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:452`
- 问题描述: workspace-op runtime 里仍有多处英文直出错误/回退文案，例如 upgrade apply 校验失败、CLI 依赖缺失、默认消息回退和 parseable-result fallback；VS Code 层会直接展示这些消息。
- 影响: zh-CN 用户会在 bootstrap/doctor/check/adopt/host/upgrade 路径里看到英文错误或英文 fallback，违背 `CS-033`。
- 建议: 用 locale-aware `localizeText` bridge 收敛这批 user-facing 文案，并补中文错误/回退回归测试。

### 2.2 [P3] Upgrade-report lookup introduced an unannotated dynamic `require`
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:813`
- 问题描述: `resolveLatestUpgradeReportPath()` 之前新增了 `requireFromRuntime('node:fs')`，但没有 `// dynamic-import-allowed: reason` 标记。
- 影响: 违反 `CS-008` 动态依赖治理，并让核心 workspace-op 路径多了一处不必要的 late-bound load。
- 建议: 直接改回静态 `readdirSync` import。

## 3. Notes

1. fresh reviewer round 5 的 2 条 actionable findings 都已在同一修复窗口闭环，没有遗留 `deferred` 项。
2. 本轮修复继续围绕 sprint-001 边界，只收敛 workspace-op i18n 与 import governance，不扩展新的产品能力范围。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：workspace-op runtime 现在对 upgrade apply 校验失败、unsupported operation、CLI 依赖缺失、默认消息回退、CLI payload 缺字段和 parseable-result fallback 都走 locale-aware `localizeText` bridge；新增 `zh-CN` 测试覆盖中文错误与 fallback summary。
   - 处理：已接受并修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`resolveLatestUpgradeReportPath()` 已改回顶层静态 `readdirSync` import，不再新增动态 `require('node:fs')`。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：workspace-op runtime 剩余的用户可见错误/回退文案已全部改成 locale-aware 文本，不再把英文 raw string 直接冒到 VS Code。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
   - 验证：`pnpm run check`（通过）
   - 说明：upgrade report lookup 改回静态 import，恢复 `CS-008` 期望的静态依赖治理。
