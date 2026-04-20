# Code Review: project-114 vscode plugin full ownership and zero-cli user path final delegated review round 8

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-008`
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
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. Review Scope
1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md`
3. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
6. `/Users/jimmydaddy/study/ai-governor/packages/config/src/types/interfaces/governor.interface.ts`
7. `/Users/jimmydaddy/study/ai-governor/packages/config/src/workspace-resolver.ts`
8. `/Users/jimmydaddy/study/ai-governor/packages/config/test/workspace-resolver.integration.test.ts`
9. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/package.json`
10. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
11. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
12. `/Users/jimmydaddy/study/ai-governor/scripts/release/pack-vscode-extension.js`
13. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js`
14. `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
15. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
16. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
17. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
18. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
19. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/`

## 2. Findings
### 2.1 [P1] Reverse app-layer dependency on CLI
- 位置: `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/package.json:29`
- 问题描述: 规则类型：rule-backed。`core-orchestration-service` 显式声明了 `@repo-ai-governor/cli`，而 `apps/cli` 已经依赖 `@repo-ai-governor/core-orchestration-service`；这构成了 app -> core 方向的反向依赖，违反仓库架构的模块依赖方向约束。
- 影响: shared service layer 会被 app-layer entrypoint 反向耦合，既破坏 package graph，也让非 CLI 消费者无端携带 CLI app。
- 建议: 让 CLI 继续作为上层消费者显式依赖 core/service，而不是让 core package 反向声明 CLI app 依赖。

### 2.2 [P2] CLI-backed doctor proof is documented as green despite warn-state evidence
- 位置: `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js:350`；`/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md:172`
- 问题描述: 风险类型：risk-based inference。release verifier 会记录 `doctorCheckTotals`，但当前 gate 并不会因为非阻断 warning 而失败；与此同时，support docs 把这条 packaged VSIX / extracted VSIX proof 写成了“CLI-backed secure-authoring plus doctor smoke green”，比当前 gate 真正证明的内容更强。
- 影响: public support truth 可能暗示 warn-free doctor readiness，而实际不可变报告只证明了 scratch-isolated diagnostics capture 与 surfaced totals。
- 建议: 不在 closeout 窗口里生硬收紧 doctor gate，而是把 verifier contract 命名和公开文案一起收敛到“isolated doctor diagnostics capture + surfaced check totals”的真实支持口径。

## 3. Notes
1. 本轮 reviewer 提出的两条 findings 都成立，但都可以在当前 project-final 窗口内通过 package-graph 收敛与 support-truth wording 收窄修复，不需要推翻已有 runtime 行为或重新拆 sprint。
2. 修复后再次执行 `pnpm run check` 时，之前的 CLI/core circular package dependency warning 已经消失，可作为 P1 已收口的额外佐证。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/package.json` 确实把 `@repo-ai-governor/cli` 声明成 direct dependency，而架构文档明确要求 `apps/cli` 允许依赖 `packages/*`，但 core package 不得反向依赖 CLI app。
   - 处理：接受，移除 `packages/core-orchestration-service/package.json` 中的 `@repo-ai-governor/cli` 依赖，并同步 lockfile 与 packaging-boundary test，让 extension 继续显式持有 CLI 依赖而 core package 不反向声明。
2. `2.2`
   - 判定：**认可**
   - 证据：当前 immutable distribution report 仍会保留 `doctorCheckTotals.warn=6`，而原先 support-truth wording 把 packaged/extracted proof 表述成了更强的“doctor smoke green”，确实高于当前 gate 实际证明内容。
   - 处理：接受，保持 verifier 的当前 warn-tolerant contract，但将 helper 命名、JSDoc、integration test 与 public support wording 一并收敛到“CLI-backed secure-authoring + scratch-isolated doctor diagnostics capture with surfaced check totals”，不再暗示 warn-free doctor。

### 验证命令
1. `pnpm install --lockfile-only`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
3. `pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
4. `pnpm run build`（通过）
5. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过；最新 immutable snapshot 已提升为 `project-114-sprint-005-vscode-distribution-report-20260418T124824Z.json`）
6. `pnpm run check:ide-docs-parity`（通过）
7. `pnpm run check`（通过；未再出现 CLI/core circular package dependency warning）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/package.json`、`pnpm-lock.yaml`、`apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
   - 验证：`pnpm install --lockfile-only`、`pnpm exec vitest run --config vitest.packages.config.ts packages/config/test/workspace-resolver.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm run check`（通过）
   - 说明：core package 不再反向声明 CLI app 依赖；source-built extension 继续显式携带 CLI，而整仓 gate 也不再提示 app<->core circular package dependency。
2. `2.2`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`apps/vscode-extension/README.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`project-114-sprint-005-zero-cli-rehearsal-summary.md`
   - 新证据：`project-114-sprint-005-vscode-distribution-report-20260418T124824Z.json`
   - 验证：`pnpm exec vitest run --config vitest.integration.config.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`、`pnpm run check:ide-docs-parity`、`pnpm run check`（通过）
   - 说明：distribution verifier 现在明确把 `doctorCheckTotals` 视为 truth-carrying evidence 而不是 hard gate，public support truth 也同步收窄到“scratch-isolated doctor diagnostics capture with surfaced check totals”。

## 处置结果与剩余风险

1. CR-008 的 accepted findings 已全部修复，当前 package graph 已回到允许方向，support truth 也不再高于实际 rerun evidence。
2. additive manual GUI evidence 仍未包含真实 extension-development-host 或 VS Code `Install from VSIX...` session，因为 `code` CLI 在本环境不可用；这一点仍是可选人工证据，而非 blocker。
