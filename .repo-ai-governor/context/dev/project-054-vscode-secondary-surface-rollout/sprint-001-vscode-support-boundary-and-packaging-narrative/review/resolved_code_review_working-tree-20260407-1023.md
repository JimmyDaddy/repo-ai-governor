# Code Review: sprint-001-vscode-support-boundary-and-packaging-narrative delegated review loop round 2

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-002`
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

1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
3. `apps/vscode-extension/**`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `README.md`
9. `README.zh-CN.md`
10. `tasks/CR-002.md` / `tasks/checklist.md` / `tasks/tasks.csv`

## 2. Findings

### 2.1 [P2] Public support-truth rows overclaimed the coverage of `check:ide-docs-parity`

- 位置: `docs/support-matrix.md:73`, `docs/support-matrix.md:119`, `docs/support-matrix.zh-CN.md:73`, `docs/support-matrix.zh-CN.md:119`
- 问题描述: fresh reviewer Ramanujan pointed out that the public support rows treated `pnpm run check:ide-docs-parity` as evidence that the support matrix, playbooks, and `README*` were aligned with the packaged VS Code truth, while that gate only validates checked `integrations/ide/**` contracts/examples/docs surfaces.
- 影响: a future drift in the public support-boundary docs could still ship behind a green parity gate, weakening the support-truth evidence expected by `CS-004`.
- 建议: narrow the docs-parity claim to the checked IDE template-doc surfaces and state separately that packaged-artifact truth is backed by the packaging-boundary test plus `pnpm pack --json --dry-run`.

## 3. Notes

1. The supported VS Code path still does not have a dedicated automated extension-development-host launch smoke; this sprint continues to rely on targeted runtime tests plus packaging and docs evidence.

## 4. 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Public support-truth rows overclaimed the coverage of check:ide-docs-parity`
   - 判定：**认可**
   - 证据：`scripts/examples/check-ide-docs-parity.js` only validates Cursor and Claude Code parity across checked `integrations/ide/**` contracts/examples/docs surfaces; it does not read `docs/support-matrix*.md`, playbooks, or `README*`.
   - 处理：已把 support-matrix 英中两份文档改为如实描述 `check:ide-docs-parity` 的覆盖范围，并把 packaged VS Code truth 明确回收到 packaging-boundary test 与 `pnpm pack --json --dry-run`。

### 验证命令

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm pack --json --dry-run`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`（通过）

## 5. 修复执行记录（2026-04-07）

1. `2.1 [P2] Public support-truth rows overclaimed the coverage of check:ide-docs-parity`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`
   - 说明：`check:ide-docs-parity` 现在只被表述为 checked IDE template-doc parity 证据；公开 VS Code 支持边界的 packaged-artifact 真值改由 packaging-boundary test 与 dry-run pack manifest 支撑。

## 6. Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm pack --json --dry-run`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`（通过）
