# Code Review: project-114 vscode plugin full ownership and zero-cli user path

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-002`
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
1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/current-context.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
3. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension`
4. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service`
5. `/Users/jimmydaddy/study/ai-governor/packages/orchestration-service-client`
6. `/Users/jimmydaddy/study/ai-governor/scripts/release/pack-vscode-extension.js`
7. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js`
8. `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
9. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
10. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
11. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
12. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
13. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
14. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`

## 2. Findings
### 2.1 [P1] Packaged VSIX omits the embedded CLI dependency required by zero-CLI runtime flows
- 位置: `/Users/jimmydaddy/study/ai-governor/scripts/release/pack-vscode-extension.js:27`, `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js:205`, `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/package.json:304`, `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:681`, `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1290`
- 问题描述: 当前 packaged extension root / extracted VSIX 都没有带上 `@repo-ai-governor/cli`，但 packaged runtime 会在 secure-authoring 和 workspace-operation 路径上直接 `requireFromRuntime.resolve('@repo-ai-governor/cli')`。因此 distribution verify 仍然通过时，实际 packaged `doctor` / `check` / secure-authoring / workspace-operation 用户路径已经损坏。
- 影响: `project-114` 的 zero-cli packaged path 只证明了 module/sidecar readiness，却不能真正执行承诺给用户的核心治理操作，属于 project-final blocker。
- 建议: 修正 dependency ownership / lock/deploy truth，让 packaged artifact 必须包含 CLI 运行时依赖，并把 distribution verify 升级为至少执行一条 CLI-backed packaged smoke。

### 2.2 [P2] Public support truth currently overstates packaged zero-CLI coverage
- 位置: `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md:83`, `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md:96`, `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md:11`, `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md:138`
- 问题描述: 当前 support docs 与 sprint-local evidence 把 local VSIX / packaged-extension path 宣称为可完成 bootstrap/readiness、`doctor`、`check`、workflow authoring、run/review、automation、`adopt / host / verify / upgrade` 的 zero-cli human path；但 packaged artifact 在这些 CLI-backed flows 触发前就因缺少内嵌 CLI 依赖而失败。
- 影响: public support truth 与真实 packaged behavior 失真，若不修 runtime defect 就不能继续维持当前 closeout-ready claim。
- 建议: 与 2.1 同窗修复 packaged dependency/runtime defect，并在同一窗口重跑 distribution verify；若无法修复，则必须回收 docs/evidence 的支持口径。

## 3. Notes
1. `TK-988` 仍是 `planned`，所以即使本轮 findings 修复完成，project 也还需要 completion audit summary、milestone backlink 与 idle-context restoration 才能宣称 `completed`。
2. 本轮 reviewer 对 packaged path 做了额外 smoke；主 agent 也已本地复现 `require.resolve('@repo-ai-governor/cli')` 失败，因此 2.1 不再只是风险推断。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过，project-final review 前基线）
2. `pnpm run build`（通过，project-final review 前基线）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-sprint-005-vscode-distribution-report.json`（通过，project-final review 前基线）
4. `pnpm pack --json --dry-run > .tmp/project-114-sprint-005-pack-dry-run.json`（通过，project-final review 前基线）
5. `pnpm run check:ide-entry-smoke`（通过，project-final review 前基线）
6. `pnpm run check:ide-docs-parity`（通过，project-final review 前基线）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过，project-final review 前基线）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，project-final review 前基线）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过，project-final review 前基线）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过，project-final review 前基线）
11. `pnpm run check`（通过，project-final review 前基线）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：主 agent 已本地复现 packaged extension root 下缺失 `@repo-ai-governor/cli`，并确认 workspace-op / secure-authoring path 之前错误地把 `@repo-ai-governor/cli` 的库入口当成 executable entry 启动；在补齐依赖归属、lockfile、package-root required paths、CLI-backed smoke 与 embedded `runCli()` bootstrap 后，fresh rerun 已让 packaged root / extracted VSIX 同时通过 secure-authoring + `doctor` smoke。
   - 处理：已接受，修复 dependency ownership、embedded CLI bootstrap contract 与 distribution verify gate，使 packaged zero-cli path 真正覆盖 CLI-backed runtime seams。
2. `2.2`
   - 判定：**认可**
   - 证据：原先 support docs 与 sprint-local evidence 只明确回链 module/sidecar smoke，缺少 packaged/extracted CLI-backed secure-authoring + `doctor` smoke 的公开证明口径；如果不在同一窗口补齐 evidence snapshot 与文案，public support truth 仍会落后于真实 runtime contract。
   - 处理：已接受，在同一窗口刷新 README / support matrix / maintainer playbook / sprint-local evidence summary 与 immutable distribution snapshot，把 zero-cli packaged proof boundary 写实到公开 support truth。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/package.json`、`pnpm-lock.yaml`、`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`scripts/release/pack-vscode-extension.js`、`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`pnpm run build`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）
   - 说明：packaged extension root 与 extracted VSIX 现在都携带 `@repo-ai-governor/cli` / `@repo-ai-governor/config`，embedded CLI bootstrap 改为显式调用导出的 `runCli()`，service-owned `doctor` path 保持 machine-readable JSON contract，distribution gate 也新增并通过了 package/extracted CLI-backed secure-authoring + `doctor` smoke。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/README.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-support-truth-contract.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-vscode-distribution-report-20260418T090755Z.json`
   - 验证：`pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）
   - 说明：public support truth 与 sprint-local evidence 现在明确写出 packaged root / extracted VSIX 的 module smoke、sidecar smoke 与 CLI-backed secure-authoring + `doctor` smoke，并把本轮 proof window 回链到新的带时间戳 immutable snapshot。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复，并重跑了 targeted vitest、`pnpm run build`、`release:verify-vscode-extension-distribution`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke` 与 `pnpm run check:ide-docs-parity`。
2. project-114 的 packaged zero-cli support truth 现在已经与真实 runtime/evidence 对齐，不再依赖缺失 CLI 依赖、错误 executable entry，或缺少 CLI-backed smoke 的证明链。
3. GUI `Install from VSIX...` 与真实 extension-development-host 启动仍然是可选人工补充证据，不属于本轮 automated proof 的阻断项。
