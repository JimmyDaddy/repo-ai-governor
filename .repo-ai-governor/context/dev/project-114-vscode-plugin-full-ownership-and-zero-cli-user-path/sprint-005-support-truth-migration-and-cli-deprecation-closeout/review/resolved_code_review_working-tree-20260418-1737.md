# Code Review: project-114 vscode plugin full ownership and zero-cli user path post-fix recheck round 4

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-004`
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
1. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
3. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/package.json`
4. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
5. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
6. `/Users/jimmydaddy/study/ai-governor/scripts/release/pack-vscode-extension.js`
7. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js`
8. `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
9. `/Users/jimmydaddy/study/ai-governor/pnpm-lock.yaml`
10. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-project-final-handoff.md`
11. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
12. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-support-truth-contract.md`
13. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md`
14. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
15. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
16. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
17. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`

## 2. Findings
### 2.1 [P1] Packaged distribution verification now writes into the caller's real workspace truth surfaces
- 位置: `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js:247`
- 问题描述: 风险类型：risk-based inference。`runPackagedCliBackedSmoke()` 把“restore latest workspace operation snapshot”硬编码到 `PROJECT_ROOT/context/runtime/latest-workspace-operation.snapshot.json`，但 `LocalOrchestrationServiceWorkspaceOpsRuntime` 实际会按解析后的 `workspaceRoot` 持久化到 `workspaceRoot/context/runtime/latest-workspace-operation.snapshot.json`，并且 `doctor` 还会额外写入 `workspaceRoot/context/diagnostics/doctor/doctor-*.json`。我在本轮验证里实际运行 `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json` 后，看到 `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/runtime/latest-workspace-operation.snapshot.json` 被改写为本次 packaged smoke 的 `Doctor completed with attach_mode=read_write.`，同时新增 `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/doctor/doctor-1776505573639.json`。也就是说，这个 release gate 会把 maintainer 的分发验证回写成用户真实 workspace 的最新 doctor / workspace-operation truth。
- 影响: project-114 这轮把 VS Code workbench 与 zero-cli support truth 收口到“service-owned runtime truth”上；如果分发验证本身会污染真实 workspace read model，那么 Workbench Overview、doctor diagnostics readback 与后续 support evidence 都可能被 maintainers 的 packaging smoke 覆盖，形成用户可见的状态漂移。
- 建议: 让 packaged CLI-backed smoke 运行在隔离的临时 workspace root，或在执行前后解析并恢复真实的 `workspaceRoot` 下所有受影响的 artifact 路径（至少包括 `latest-workspace-operation.snapshot.json` 与 `context/diagnostics/doctor/doctor-*.json`），而不是写死到 `PROJECT_ROOT/context/...`。

### 2.2 [P2] Embedded CLI bootstrap failure copy bypasses the repo's i18n contract
- 位置: `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:704`; `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1310`
- 问题描述: `renderEmbeddedCliBootstrapSource()` 在两个 runtime 里都把 `Embedded CLI module did not expose runCli().` 直接写成了硬编码英文 JSON message，然后外层错误读取逻辑会原样把该 message 回传给用户。这个分支不再经过 `localizeText(...)` / `vscode.env.language`，会让 `zh-CN` 调用方在 embedded CLI 入口损坏时收到英文硬失败文案，违反 `CS-033` 对 `apps/**` 与 `packages/**` 用户可见文本必须走 i18n 的要求。
- 影响: 一旦 packaged VSIX / embedded CLI 依赖出现入口漂移，用户会在最关键的恢复路径里看到单语英文错误；这与当前 workspace-ops / VS Code runtime 已有的中英文本地化契约不一致，也绕过了现有本地化测试覆盖的预期。
- 建议: 在宿主 runtime 侧先生成本地化后的 message 再注入 bootstrap source，或让子进程返回一个稳定的 sentinel code、再由父进程按 locale 映射成本地化文案；同时补一条覆盖该失败分支的 `zh-CN` 回归测试。

## 3. Notes
1. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`、`pnpm run check` 和 targeted vitest 都通过了 happy-path 验证，所以本轮问题不是“功能没跑通”，而是 closeout gate 本身会回写真实 workspace state，现有 happy-path 测试没有覆盖到这类 side effect。
2. `pnpm run check` 最终通过，但 Turbo 在本轮输出了 `@repo-ai-governor/cli <-> @repo-ai-governor/core-orchestration-service` 的 circular dependency warning。当前门禁仍是 warning-only，我没有把它单独升级为 actionable finding；不过考虑到本轮 embedded CLI seam 正是从这里引入，后续修复时最好一并评估这条依赖边界。
3. docs / handoff / support-truth backlink 已经收敛到 `20260418T090755Z` 这份 immutable evidence snapshot；本轮新的 actionable issues 都来自 runtime/release gate 自身，而不是 closeout 文档回链。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过，但观察到真实 tool-managed workspace 下的 `latest-workspace-operation.snapshot.json` 与 `doctor-*.json` 被本次 smoke 回写）
5. `pnpm pack --json --dry-run`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `pnpm run check:ide-docs-parity`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）
12. `pnpm run check`（通过；Turbo 报告 `@repo-ai-governor/cli` 与 `@repo-ai-governor/core-orchestration-service` circular dependency warning）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`runPackagedCliBackedSmoke()` 仍把 snapshot restore 锁死到 `PROJECT_ROOT/context/runtime/latest-workspace-operation.snapshot.json`，而 `LocalOrchestrationServiceWorkspaceOpsRuntime` 的实际持久化目标来自解析后的 `context.workspaceRoot`；fresh reviewer 同窗观察到真实 tool-managed workspace 下的 `latest-workspace-operation.snapshot.json` 与 `context/diagnostics/doctor/doctor-*.json` 被 smoke 覆盖，说明当前 release gate 确实在污染 live workspace truth。
   - 处理：接受，改为让 packaged/extracted CLI-backed smoke 在 `workingRoot` 下的隔离 scratch workspace 运行，不再回写 maintainer 的真实 workspace state。
2. `2.2`
   - 判定：**认可**
   - 证据：两个 runtime 的 `renderEmbeddedCliBootstrapSource()` 都把 `Embedded CLI module did not expose runCli().` 直接注入子进程 JSON payload，绕过了已有的 locale 解析与本地化 helper，属于真实用户失败路径上的 i18n 漏口。
   - 处理：接受，由宿主 runtime 先生成 locale-aware failure message 再注入 bootstrap source，并补最小回归测试覆盖 zh-CN 分支。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过，fix 前基线）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过，fix 前基线）
3. `pnpm run build`（通过，fix 前基线）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过，fix 前基线）
5. `pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`（通过，fix 前基线）
6. `pnpm run check:ide-entry-smoke`（通过，fix 前基线）
7. `pnpm run check:ide-docs-parity`（通过，fix 前基线）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过，fix 前基线）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，fix 前基线）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过，fix 前基线）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过，fix 前基线）
12. `pnpm run check`（通过，fix 前基线）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`、`pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm run check`（通过）
   - 说明：packaged/extracted CLI-backed smoke 现改为在 packaging `workingRoot` 下的隔离 scratch workspace 中运行，不再回写 maintainer 的真实 workspace doctor / latest-workspace-operation truth。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：宿主 runtime 现在会先解析 locale-aware failure message 再注入 embedded CLI bootstrap source，zh-CN 失败分支不再回退为硬编码英文文案。

## 处置结果与剩余风险

1. CR-004 的 accepted findings 已全部修复并通过 targeted vitest、integration、`pnpm run build`、distribution verify、pack dry-run、IDE smoke/docs parity 与 `pnpm run check`。
2. packaged/extracted CLI-backed smoke 仍保留同样的 proof boundary，但其 scratch outputs 现在限定在 packaging `workingRoot` 下，不再污染真实 workspace truth。
3. `pnpm run check` 仍会输出 `@repo-ai-governor/cli <-> @repo-ai-governor/core-orchestration-service` circular dependency warning；当前 gate 为 warning-only，因此本轮不阻断 closeout，但需要在后续依赖边界治理窗口单独处理。
