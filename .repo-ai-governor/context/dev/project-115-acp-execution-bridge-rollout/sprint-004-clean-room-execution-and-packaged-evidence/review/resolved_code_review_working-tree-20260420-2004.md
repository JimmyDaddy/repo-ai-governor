# Code Review: sprint-004-clean-room-execution-and-packaged-evidence

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent delegated reviewer loop
- Task: `CR-001`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `scripts/release/verify-cleanroom-local-install.js`
2. `package.json`
3. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
4. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`
5. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**`
6. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/**`

## 2. Findings
### 2.1 [P2] ACP execution harness missed the required dynamic-import exception marker
- 位置: `scripts/release/verify-cleanroom-local-install.js`
- 问题描述: clean-room ACP execution harness 通过 `require.resolve()` + `import()` 按安装包 `dist/**` 路径动态加载 runtime 模块，但新增 loader 周边没有 `// dynamic-import-allowed: reason` 标记。该问题直接违反 `CS-008` 对动态依赖加载例外的显式注释要求。
- 影响: 当前窗口虽然通过了 clean-room rerun，但该例外没有被治理规则显式记录，未来很容易在动态导入门禁或代码清理时被误判、误删或阻断。
- 建议: 在 installed-module loader 附近补齐 `dynamic-import-allowed` 注释，并把原因写清楚为“必须验证安装包内 dist 输出，而不是源码工作区”。

## 3. Notes
1. reviewer 额外指出两个非 blocker 风险：`acpExecutionScenarios` 目前只保存在 `.tmp/project-115-sprint-004-acp-cleanroom-report.json`，以及 `stage9aHardExit.passed=false` 仍然是 `--iterations 1` 基线下的预期结果。两点都与 `TK-999 / TK-1000` 当前记录的 conservative rollout boundary 一致，因此本轮不升级为 actionable finding。
2. support-facing summary / receipts / provenance 仍然只承载保守的 readiness receipt；更细粒度的 ACP execution semantics 继续保留在 report-level artifact，等待 sprint-005 按 conservative support claim 收口。

## 4. Verification
1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`createAcpExecutionCheckScript()` 内的 installed-module loader 现在带有 `dynamic-import-allowed` 原因注释，明确说明 clean-room harness 必须验证安装包 `dist/**` 输出而不是源码工作区。
   - 处理：已在 `scripts/release/verify-cleanroom-local-install.js` 中补齐例外注释，并重跑 clean-room verify、targeted vitest、`pnpm run build` 与 `pnpm run test:packages`。

### 验证命令
1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-20）

1. dynamic-import exception annotation：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`
   - 验证：`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`、`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：installed-package loader 的 dynamic import 例外已经被显式治理记录，不再依赖隐式例外。

## 处置结果与剩余风险

1. `CR-001` 已清除本轮唯一 actionable finding，sprint-004 当前实现面满足进入 closeout task 的条件。
2. execution-proof 细节仍主要保存在 `.tmp/project-115-sprint-004-acp-cleanroom-report.json`；该设计符合本 sprint 的 conservative support boundary，但后续审计若需要复现 execution semantics，仍应保留该报告或重跑 clean-room verify。
3. `stage9aHardExit` 仍保持非 blocker 状态，后续若进入 hard-exit / GA 风格关口，需要以更高 iteration 重跑 clean-room baseline。
