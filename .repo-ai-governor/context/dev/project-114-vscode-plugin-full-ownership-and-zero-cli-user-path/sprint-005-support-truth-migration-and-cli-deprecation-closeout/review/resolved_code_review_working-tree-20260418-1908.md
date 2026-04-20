# Code Review: project-114 vscode plugin full ownership and zero-cli user path final delegated review round 6

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-006`
- Review Type: delegated project-final review
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
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts`
2. `/Users/jimmydaddy/study/ai-governor/packages/config/src/types/interfaces/governor.interface.ts`
3. `/Users/jimmydaddy/study/ai-governor/packages/config/src/workspace-resolver.ts`
4. `/Users/jimmydaddy/study/ai-governor/packages/config/test/workspace-resolver.integration.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/package.json`
6. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
7. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
9. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
10. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
11. `/Users/jimmydaddy/study/ai-governor/scripts/release/pack-vscode-extension.js`
12. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js`
13. `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
14. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md`
15. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
16. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
17. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
18. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
19. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/`

## 2. Findings
### 2.1 [P1] Constructor-level scratch workspace routing is still ignored by the workspace-ops runtime
- 位置: `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:397`
- 问题描述: 风险类型：risk-based inference。`resolveWorkspaceContext()` 在 `repositoryRoot` 存在时从未把 `dependencies.workspaceRoot` 传给 `WorkspaceResolver.resolve()`，所以 runtime 仍会落回默认的 tool-managed workspace，而不是调用方显式传入的 scratch root。reviewer 用 source-level probe 验证了 `{ workspaceRoot: '/tmp/scratch-workspace/.repo-ai-governor', repositoryRoot: '/repo' }` 仍然解析到 `~/.repo-ai-governor/workspaces/...`。
- 影响: CLI-backed `doctor/check` 这类本应隔离到 scratch workspace 的流，仍可能把诊断和 runtime state 写回 maintainer/live workspace，project-final 的 zero-cli packaged smoke 隔离契约并没有真正落到生产路径。
- 建议: 让 `resolveWorkspaceContext()` 将构造参数 `workspaceRoot` 通过 `runtimeOverrides.workspaceRoot` 显式传入 resolver，并补 focused unit test 覆盖 “`repositoryRoot + workspaceRoot` 直传时仍命中显式 root” 的生产路径。

### 2.2 [P2] Release verifier 目前验证的是自定义 shim，而不是生产 workspace-root 路径
- 位置: `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js:304`
- 问题描述: 风险类型：risk-based inference。`runPackagedCliBackedSmoke()` 注入了一个始终返回 scratch root 的自定义 `workspaceResolver`，这会让 packaged/extracted CLI-backed smoke 绿掉，即使生产代码路径里 `resolveWorkspaceContext()` 还没有正确消费构造参数 `workspaceRoot`。
- 影响: 当前 release evidence 证明的是 shimmed seam，而不是生产合同；只要自定义 resolver 还在，`CR-006` 的 P1 这类生产 misroute 仍可能被 release verify 掩盖掉。
- 建议: 修正 runtime 后移除该 resolver shim，或至少增加一条使用真实构造路径的 smoke，让 release gate 能直接证明 constructor-level `workspaceRoot` 被 end-to-end 尊重。

### 2.3 [P3] 新增的 VS Code bootstrap failure copy 仍绕过 i18n bridge
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1329`
- 问题描述: `resolveEmbeddedCliBootstrapFailureMessage()` 直接返回硬编码的英文/中文字符串，而不是走仓库要求的 `localizeText(english, chinese)` bridge。
- 影响: 这条用户可见错误消息脱离了 i18n parity 路径，后续文案或 locale 变化时更容易漂移。
- 建议: 把这条 message 接回 extension runtime 内的 `localizeText` helper，并让测试验证 helper 驱动的本地化输出，而不是继续锁死硬编码字符串。

## 3. Notes
1. 本轮 reviewer 没有在 README / support-matrix / maintainer playbook / task-ledger surface 上发现额外 actionable finding，主要 blocker 都集中在 workspace-root 的真实生产合同与这条新增错误消息的 i18n 治理。
2. 当前提供的 package/release verification 已经覆盖了 shimmed smoke 与 release gate happy path，但还没有证明 `LocalOrchestrationServiceWorkspaceOpsRuntime` 的构造参数 `workspaceRoot` 在生产路径中被直接消费。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过，但 reviewer 认为当前路径仍被 custom resolver shim 掩盖）
5. `pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `pnpm run check:ide-docs-parity`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）
12. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceWorkspaceOpsRuntime.resolveWorkspaceContext()` 的确没有把 `dependencies.workspaceRoot` 传入 `WorkspaceResolver.resolve()`，所以在 `repositoryRoot` 存在时会落回默认 tool-managed workspace；reviewer 的 source-level probe 与当前源码一致。
   - 处理：接受，改为通过 `runtimeOverrides.workspaceRoot` 将构造参数 `workspaceRoot` 注入 baseline/resolved workspace 两次解析，并补 focused unit test 证明 `{ repositoryRoot, workspaceRoot }` 构造路径返回显式 scratch root。
2. `2.2`
   - 判定：**认可**
   - 证据：release verifier 之前确实依赖 custom `workspaceResolver` shim，因此 smoke 证明的是 stubbed seam，而不是 production constructor path。
   - 处理：接受，移除 `runPackagedCliBackedSmoke()` 的 custom resolver shim，直接让 packaged/extracted smoke 走 runtime 的真实 constructor-level `workspaceRoot` 路径，并把 `resolvedWorkspaceRoot === smokeWorkspaceRoot` 升级成 release gate 断言。
3. `2.3`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` 里这条新增 user-facing message 确实是硬编码双语字符串，没有走仓库要求的 `localizeText(english, chinese)` bridge，符合 `CS-033` reviewer 指出的问题。
   - 处理：接受，新增 extension-local `localizeText` helper 并让 bootstrap failure message 通过该 helper 输出，保留现有 zh-CN 行为但回到治理要求的 i18n 路径。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过；packaged root / extracted VSIX 都已证明 `resolvedWorkspaceRoot === smokeWorkspaceRoot`）
5. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）
   - 说明：workspace-ops runtime 现在会在生产路径中直接消费 constructor-level `workspaceRoot`，不再依赖 custom resolver 才能把 CLI-backed doctor/check 隔离到 scratch workspace。
2. `2.2`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`、`pnpm run check`（通过）
   - 说明：release verifier 已移除 shimmed resolver，并将 packaged/extracted CLI-backed smoke 收紧为真实 constructor path + exact scratch-root assertion。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：VS Code embedded CLI bootstrap failure message 已回到 `localizeText` i18n bridge，不再保留孤立的硬编码双语 copy。

## 处置结果与剩余风险

1. CR-006 的 accepted findings 已全部修复并通过 targeted package slice、真实 release integration、`pnpm run build`、distribution verify 与 `pnpm run check`。
2. project-final release evidence 现在验证的是生产 constructor-level `workspaceRoot` 合同，而不是 custom resolver shim；如果 scratch-root routing 再退化，release gate 会直接失败。
3. `pnpm run check` 仍会输出 `@repo-ai-governor/cli <-> @repo-ai-governor/core-orchestration-service` circular dependency warning；当前仍是 warning-only，不阻断 project-114 closeout，但需要在后续依赖边界治理窗口处理。
