# Code Review: sprint-001-vscode-support-boundary-and-packaging-narrative delegated review loop round 1

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
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

1. `apps/vscode-extension/**`
2. `docs/support-matrix.md`
3. `docs/support-matrix.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `README.md`
9. `README.zh-CN.md`
10. `tasks/TK-607.md` / `TK-608.md` / `TK-609.md` / `tasks.csv` / `checklist.md`

## 2. Findings

### 2.1 [P2] Packaging-boundary test did not verify the published artifact

- 位置: `apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts:5`
- 问题描述: round-1 fresh reviewer Zeno noted that the original packaging-boundary test only asserted `package.json.files` and could not prove the published tarball still omitted the extension workspace, manifest files, and resources once `dist/**` payloads were included.
- 影响: public support claims about “source-checkout only” VS Code support could drift from the actual published artifact contents without any guard failing.
- 建议: verify the real `pnpm pack --json --dry-run` file list and tighten the docs to distinguish internal `dist/apps/vscode-extension/**` payloads from an installable extension bundle.

## 3. Notes

1. No extension-development-host end-to-end launch smoke was added in this sprint window; the supported path is still backed by build, targeted tests, package-manifest inspection, and docs parity.

## 4. 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Packaging-boundary test did not verify the published artifact`
   - 判定：**认可**
   - 证据：`pnpm pack --json --dry-run` 当前确实包含 `dist/apps/vscode-extension/**`，因此原先只检查 `package.json.files` 的测试不足以支撑“packaged distribution not supported”的对外口径。
   - 处理：已把测试升级为真实读取 `pnpm pack --json --dry-run` manifest，确认 tarball 不包含 `apps/vscode-extension` workspace、manifest、i18n metadata 与资源文件，同时把文档表述收紧为“内部 `dist/apps/vscode-extension/**` 产物不等于正式扩展分发”。

### 验证命令

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm pack --json --dry-run`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`（通过）

## 5. 修复执行记录（2026-04-07）

1. `2.1 [P2] Packaging-boundary test did not verify the published artifact`：已完成
   - 变更文件：`apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`apps/vscode-extension/README.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`README.md`、`README.zh-CN.md`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`
   - 说明：修复后 public support truth 与实际 dry-run package manifest 对齐，明确区分了 source-checkout secondary surface 与非正式 packaged distribution。

## 6. Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm pack --json --dry-run`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`（通过）
