# Code Review: project-114 vscode plugin full ownership and zero-cli user path post-fix recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-003`
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
1. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/package.json`
2. `/Users/jimmydaddy/study/ai-governor/pnpm-lock.yaml`
3. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
7. `/Users/jimmydaddy/study/ai-governor/scripts/release/pack-vscode-extension.js`
8. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-vscode-extension-distribution.js`
9. `/Users/jimmydaddy/study/ai-governor/test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
10. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md`
11. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
12. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
13. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
14. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
15. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-project-final-handoff.md`
16. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
17. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-support-truth-contract.md`
18. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-vscode-distribution-report-20260418T090755Z.json`

## 2. Findings
### 2.1 [P1] Project-final handoff still pointed to the pre-fix VS Code distribution snapshot
- 位置: `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-project-final-handoff.md:12`
- 问题描述: project-final handoff 仍回链 `project-114-sprint-005-vscode-distribution-report-20260418T075344Z.json`，而当前 support truth 与 zero-cli rehearsal summary 已切换到 `20260418T090755Z` snapshot，后者才包含 packaged CLI-backed secure-authoring 与 `doctor` smoke 的新证明链。
- 影响: `TK-988` 若沿用旧 handoff 证据集，会让 completion audit 与当前 zero-cli packaged support claim 脱节，违反 `CS-004` 对真实交付证据的要求。
- 建议: 将 handoff 与相关 closeout/backlink 路径统一切到 `20260418T090755Z` snapshot，并收敛同窗 scratch output 命名。

## 3. Notes
1. fresh reviewer 没有发现新的 packaged zero-cli runtime/blocking defect；本轮唯一 actionable finding 是 project-final closeout backlink 仍停留在 pre-fix evidence。
2. 本轮修复只涉及 handoff/evidence/doc backlink，同窗口没有新增可执行代码变更。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过，CR-003 review 前基线）
2. `pnpm run build`（通过，CR-003 review 前基线；本轮 docs-only fix 未新增可执行代码变更）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过，CR-003 review 前基线）
4. `pnpm pack --json --dry-run > .tmp/project-114-project-final-pack-dry-run.json`（通过，CR-003 review 前基线）
5. `pnpm run check:ide-entry-smoke`（通过，CR-003 review 前基线）
6. `pnpm run check:ide-docs-parity`（通过，fix 后复跑）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过，fix 后复跑）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，fix 后复跑）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过，fix 后复跑）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过，fix 后复跑）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`project-114-sprint-005-project-final-handoff.md` 仍指向 `20260418T075344Z` snapshot，而当前 support matrix、rehearsal summary 与 immutable evidence 已切到 `20260418T090755Z` snapshot；旧 snapshot 不含 `packageCliBackedSmoke` / `installedCliBackedSmoke`。
   - 处理：已接受，统一将 handoff、README、maintainer playbook 与 sprint-local summary 中的 scratch/immutable evidence backlink 切换到本轮 `20260418T090755Z` prove chain。

### 验证命令
1. `pnpm run check:ide-docs-parity`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
5. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-project-final-handoff.md`、`apps/vscode-extension/README.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
   - 验证：`pnpm run check:ide-docs-parity`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：project-final closeout 现在统一回链 `20260418T090755Z` immutable distribution snapshot，并使用 `.tmp/project-114-project-final-vscode-distribution-report.json` / `.tmp/project-114-project-final-pack-dry-run.json` 作为本轮 scratch output；closeout handoff 不再停留在 pre-fix evidence set。

## 处置结果与剩余风险

1. CR-003 的唯一 actionable finding 已完成修复，project-final handoff、support docs 与 sprint-local evidence backlink 已收敛到同一份 post-fix prove chain。
2. 本轮 fix 为 docs/handoff-only；没有新增可执行代码改动，因此无需额外重跑 `pnpm run build`，仍沿用同窗口已通过的 build evidence。
3. fresh reviewer 未发现新的 packaged zero-cli runtime blocker；GUI `Install from VSIX...` 与真实 extension-development-host 启动仍保持为可选人工补充证据。
