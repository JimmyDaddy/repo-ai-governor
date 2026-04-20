# Code Review: project-114 vscode plugin full ownership and zero-cli user path post-fix recheck round 5

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-005`
- Review Type: delegated project-final post-fix recheck
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
1. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js`
2. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
4. `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
6. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-support-truth-contract.md`

## 2. Findings
### 2.1 [P1] Packaged CLI-backed smoke still resolves and writes `doctor` artifacts into the live tool-managed workspace
- 位置: `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js:261`; `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:181`; `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:272`; `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:459`; `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:607`
- 问题描述: 风险类型：risk-based inference。`runPackagedCliBackedSmoke()` 创建了 `smokeWorkspaceRoot` 并注入自定义 `workspaceResolver`，但 `querySecureAuthoring()` / `runWorkspaceOperation()` 实际拉起嵌入式 CLI 时仍只把 `currentWorkingDirectory` 固定为 `context.repositoryRoot`，`doctor` 也仅以 `['doctor', '--adapters']` 启动，没有把 scratch `workspaceRoot` 显式传入子进程。复跑 `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-round5-review-vscode-distribution-report.json` 后，scratch snapshot `.tmp/release-vscode-extension-package/cli-backed-smoke-workspaces/packaged-root/context/runtime/latest-workspace-operation.snapshot.json` 虽然存在，但其中 `workspace_root` 仍然是 `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor`，并把 `doctor_diagnostics.path` 指向 `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/doctor/doctor-1776506997875.json`。同一复跑窗口里，真实 workspace 下的 `doctor-*.json` 数量也从 `968` 增加到 `970`。
- 影响: round-4 的隔离修复只把 service-owned latest snapshot 留在了 scratch 目录里，但 packaged smoke 仍会往 maintainer 的真实 workspace diagnostics truth 写入新产物。release verify 自己继续污染 live workspace，会让 zero-cli support evidence 与后续 diagnosis surface 失真。
- 建议: 让 secure-authoring / doctor 的嵌入式 CLI 调用显式继承 scratch workspace runtime override（至少包含 `--workspace-mode` 与 `--workspace-root`，或等价的明确契约），并在 gate 内校验返回的 `workspace_root` 与 `doctor_diagnostics.path` 必须落在 `workingRoot/cli-backed-smoke-workspaces/**` 下，否则直接失败。

### 2.2 [P2] The new release integration test never exercises the isolation contract that just regressed
- 位置: `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts:42`
- 问题描述: 风险类型：risk-based inference。新增的 CLI-backed readiness 测试只覆盖了 `assertReadyCliBackedSmoke()` 的纯对象校验和 `resolveCliBackedSmokeWorkspaceRoot()` 的路径拼装，没有真正执行 `runPackagedCliBackedSmoke()` 或完整的 `release:verify-vscode-extension-distribution`，也没有断言 `doctor_diagnostics.path` / `workspace_root` 必须停留在 scratch root。当前代码下我复跑 `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts` 仍然是 `9/9` 全绿，但真实 distribution verify 同窗已经继续把 `doctor` 诊断写进了 live workspace。
- 影响: 这条 release-script regression 现在可以在 targeted integration slice 全绿的情况下继续泄漏到 closeout 窗口，削弱了 `project-114` 这轮对高风险发布脚本路径的证据可信度。
- 建议: 补一条真正执行 CLI-backed packaged smoke 的集成断言，校验返回的 diagnostics/artifact path 都位于 `workingRoot/cli-backed-smoke-workspaces/**`，并额外断言 maintainer live workspace 下的 `doctor-*.json` 不会因为 verifier rerun 而新增。

## 3. Notes
1. 本轮不是 clean round；我在复现出 release-script 行为问题并确认现有 targeted integration test 无法捕获该问题后停止继续扩大验证面。
2. 本轮只重跑了直接覆盖该发布脚本路径的验证命令，没有重复执行 `CR-005` 卡片中的完整验证矩阵。

## 4. Verification
1. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-round5-review-vscode-distribution-report.json`（通过，但 packaged CLI-backed smoke 仍把 `doctor` 诊断路径解析到真实 tool-managed workspace）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过，但未覆盖 live-workspace isolation regression）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：上一轮修复只把外层 service snapshot 写到了 scratch workspace，但 embedded CLI 的通用 runtime startup 仍未消费顶层 `--workspace-root`，导致 `doctor` 真正落盘的位置继续回到 live tool-managed workspace；我在当前修复前后对照了 `apps/cli/src/main.ts` 与 `packages/config/src/workspace-resolver.ts`，确认缺失点就在 runtime override 没有进入最终 workspace root 解析链。
   - 处理：接受，新增顶层 `--workspace-root` override 解析，并让 `WorkspaceResolver` 优先尊重显式 runtime `workspaceRoot`；同时把 release verify 的 CLI-backed smoke gate 扩展为必须校验 `workspace_root` 与 `doctor_diagnostics.path` 都留在 scratch root。
2. `2.2`
   - 判定：**认可**
   - 证据：原来的 release integration 只校验 helper 级对象和路径拼装，没有真正执行 build + distribution verify，更没有断言 fake live workspace 下的 `doctor-*.json` 不增长；因此这次真实泄漏可以在 targeted integration 全绿的情况下继续存在。
   - 处理：接受，重型 integration 现在会执行真实 `verify-vscode-extension-distribution`，断言 live workspace `doctor` 产物数量不变、scratch snapshot 里的 `workspace_root` 仍指向 scratch root，而且 `doctor_diagnostics` artifact 也只能落在 scratch diagnostics 目录。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过；packaged root / extracted VSIX 的 `workspace_root` 与 `doctor_diagnostics.path` 均已限制在 scratch smoke workspace 内）
5. `pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `pnpm run check:ide-docs-parity`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`packages/config/src/types/interfaces/governor.interface.ts`、`packages/config/src/workspace-resolver.ts`、`packages/config/test/workspace-resolver.integration.test.ts`、`scripts/release/verify-vscode-extension-distribution.js`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run build`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）
   - 说明：embedded CLI 现在会把顶层 `--workspace-root` 透传到 runtime context，并由 `WorkspaceResolver` 显式覆盖最终 workspace root；release verify 同时把 `workspace_root` 与 `doctor_diagnostics.path` 的 scratch containment 升级成硬门禁。
2. `2.2`：已完成
   - 变更文件：`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`（通过）
   - 说明：release integration 现在执行真实 build + distribution verify，并断言 fake live workspace 下不会新增 `doctor` 诊断，同时 scratch snapshot 的 `workspace_root` / `doctor_diagnostics` 都必须留在 packaging `workingRoot` 下。

## 处置结果与剩余风险

1. CR-005 的 accepted findings 已全部修复并通过 targeted package slice、真实 release integration、`pnpm run build`、distribution verify、pack dry-run 与 IDE smoke/docs parity。
2. `.tmp/project-114-project-final-vscode-distribution-report.json` 现在直接记录 packaged root / extracted VSIX 两条 CLI-backed smoke 的 `smokeWorkspaceRoot`、`resolvedWorkspaceRoot` 与 `doctorDiagnosticsPath`，后续如果 isolation contract 再退化，release gate 会在 closeout 前直接失败。
3. `pnpm run check` 仍会输出 `@repo-ai-governor/cli <-> @repo-ai-governor/core-orchestration-service` circular dependency warning；当前仍是 warning-only，不阻断本轮 closeout，但需要在后续依赖边界治理窗口单独收敛。
