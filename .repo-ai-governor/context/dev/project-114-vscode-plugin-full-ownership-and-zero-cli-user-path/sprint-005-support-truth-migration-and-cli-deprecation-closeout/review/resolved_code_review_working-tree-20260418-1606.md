# Code Review: sprint-005 support-truth migration and cli deprecation closeout

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint boundary review
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
1. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
6. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
7. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
8. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md`
9. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/plan.md`
10. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks/TK-979-freeze-support-truth-migration-and-cli-deprecation-contract.md`
11. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks/TK-980-execute-plugin-first-evidence-and-migration-rehearsal-bundle.md`
12. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks/TK-981-refresh-support-docs-deprecation-posture-and-adoption-guidance.md`
13. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks/TK-982-prepare-project-final-closeout-and-zero-cli-delivery-recommendation.md`
14. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-support-truth-contract.md`
15. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
16. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-project-final-handoff.md`
17. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-vscode-distribution-report-20260418T075344Z.json`

## 2. Findings
### 2.1 [P2] Installed-VSIX support wording outruns the current proof boundary
- 位置: `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md:84`, `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/README.md:97`, `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md:298`, `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md:84`, `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md:298`
- 问题描述: 当前公开文案把“本地安装的一份 VSIX”直接提升为与 source-checkout path 等价的正式支持路径，但本轮 evidence chain 实际只覆盖 packaged extension root 与 extracted VSIX 的自动化验证。sprint-local rehearsal summary 还明确记录了当前环境没有 `code` CLI，因此没有执行 GUI 安装或真实 host launch 证明。
- 影响: 公开 support truth 会超出当前可复现证据边界，维护者可能在没有真实安装演练的情况下继续保留“installed VSIX 已正式支持”的表述。
- 建议: 将公开 wording 收敛到“本地生成的 VSIX / packaged extension root 已完成自动化验证，GUI 安装仍是可选人工补充证据”，避免把未完成的 install rehearsal 写成 release-blocking proof。

### 2.2 [P3] Maintainer rerun command no longer matches the authoritative evidence bundle
- 位置: `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md:141`, `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md:141`
- 问题描述: maintainer playbook 的 VS Code rerun command 缺少 `apps/vscode-extension/test/vscode-extension-host.activation.test.ts`，而本 sprint 的 zero-cli rehearsal summary 和 CR contract 都把 activation coverage 作为 authoritative evidence bundle 的组成部分。
- 影响: 后续维护者可能在不重跑 activation wiring 覆盖的情况下刷新 `primary_workbench_claim`，让公开说明和实际验证链再次漂移。
- 建议: 将 maintainer runbook 中的 vitest slice 补齐到与本轮 evidence bundle 一致，并同步 README 中的 verification section，避免后续 truth refresh 再次丢失 activation coverage。

## 3. Notes
1. sprint-005 的 task cards、`tasks/checklist.md` 与 `tasks/tasks.csv` 在本轮 review 时保持同步，未发现阻断 closeout 的额外 ledger 漂移。
2. fresh reviewer 没有复跑命令；本轮 findings 基于当前工作树、evidence artifacts 与已声明的 verification baseline。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过，review 前基线）
2. `pnpm run build`（通过，review 前基线）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-sprint-005-vscode-distribution-report.json`（通过，review 前基线）
4. `pnpm pack --json --dry-run > .tmp/project-114-sprint-005-pack-dry-run.json`（通过，review 前基线）
5. `pnpm run check:ide-entry-smoke`（通过，review 前基线）
6. `pnpm run check:ide-docs-parity`（通过，review 前基线）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过，review 前基线）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，review 前基线）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过，review 前基线）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过，review 前基线）
11. `pnpm run check`（通过，review 前基线）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前公开文案多处把“已安装的一份 VSIX”写成正式支持边界，但 sprint-local evidence 只自动验证了 packaged root 与 extracted VSIX；`project-114-sprint-005-zero-cli-rehearsal-summary.md` 也明确记录当前环境缺少 `code` CLI，因此没有执行真实 GUI install / host launch。
   - 处理：已接受，统一把 public wording 收敛到当前自动化证据边界，并把真实 GUI 安装明确保留为可选人工补充证据。
2. `2.2`
   - 判定：**认可**
   - 证据：maintainer playbook 的 VS Code rerun command 与本 sprint 实际 evidence bundle 不一致，确实漏掉了 `apps/vscode-extension/test/vscode-extension-host.activation.test.ts`。
   - 处理：已接受，补齐 maintainer runbook 的 vitest slice，并同步 README verification section，避免后续 public truth refresh 再次丢失 activation coverage。

### 验证命令
1. `无新增自动化命令；本轮复核基于当前工作树、sprint-local evidence artifacts 与已通过的 verification baseline 完成`（未执行）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/README.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm run build`、`pnpm run check:ide-docs-parity`（通过）
   - 说明：所有公开 support wording 已收敛到当前自动化 proof boundary：正式支持继续覆盖 source checkout 与本地生成 VSIX / packaged extension root 的 packaging boundary，真实 GUI `Install from VSIX...` 仍明确保留为可选人工补充证据。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/README.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm run build`、`pnpm run check:ide-docs-parity`（通过）
   - 说明：maintainer runbook 与 README verification section 现在都回到了与本 sprint authoritative evidence bundle 一致的 vitest slice，重新纳入 activation coverage。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复，并重跑了 targeted vitest slice、`pnpm run build`、`pnpm run check:ide-docs-parity`。
2. VS Code plugin-first / zero-cli public truth 已与当前 proof boundary 重新对齐，不再把未执行的 GUI install rehearsal 写成正式自动化支持证据。
