# Code Review: sprint-005 phase-h post-fix recheck round 6

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-006`
- Review Type: sprint boundary recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `scripts/release/verify-vscode-extension-distribution.js`
2. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
3. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
4. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-006.md`

## 2. Findings
### 2.1 [P2] VS Code distribution gate still duplicated the sidecar lifecycle contract as raw strings
- 位置: `scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
- 问题描述: sidecar lifecycle 的 `ready/starting/stopping/stopped` 在 release gate 与 focused regression test 中都被硬编码，虽然仓库已经在 `packages/orchestration-service-client` 提供了统一的 `OrchestrationServiceLifecycleStatus` 常量集合。
- 影响: 这条 release-blocking gate 会和真实 runtime lifecycle contract 一起漂移，违反 `CS-009` 对有限集合业务值集中治理的要求。
- 建议: gate 与 focused test 一起复用 `OrchestrationServiceLifecycleStatus`，由共享 enum 驱动 ready check 与 negative lifecycle cases。

## 3. Notes
1. 本轮未再发现新的 support-truth / maintainer backlink drift。
2. 真实 extension-host launch / `code --install-extension` 仍属于当前文档已声明的 optional manual evidence，不是本轮自动 gate 缺口。

## 4. Verification
1. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
4. `pnpm run check:ide-docs-parity`（通过）

## 5. 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`OrchestrationServiceLifecycleStatus` 已在 shared client constants 中定义，但 release gate 与 focused test 仍各自维护 raw string lifecycle 值。
   - 处理：让 gate 与 focused test 共用 `OrchestrationServiceLifecycleStatus`，并用 shared enum 驱动 ready / non-ready lifecycle 断言。

### 验证命令
1. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
4. `pnpm run check:ide-docs-parity`（通过）

## 6. 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run build`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`、`pnpm run check:ide-docs-parity`（通过）
   - 说明：release gate 与 focused regression test 现在共享 orchestration lifecycle enum，避免 future lifecycle contract drift 让 gate 和测试一起误报通过。
