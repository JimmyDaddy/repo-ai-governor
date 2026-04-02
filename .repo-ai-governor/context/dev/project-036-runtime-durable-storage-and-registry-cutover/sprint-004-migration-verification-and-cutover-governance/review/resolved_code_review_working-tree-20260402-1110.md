# Code Review: project-036 sprint-004 artifact-registry sqlite cutover working tree

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/artifact-registry/src/sqlite-artifact-index-store.ts`
2. `scripts/governance/artifact-registry-canonical.js`
3. `scripts/governance/check-artifact-registry-lifecycle.js`
4. `scripts/governance/reconcile-artifact-dependencies.js`
5. `scripts/governance/compact-artifact-registry.js`
6. `scripts/governance/task-ledger-projection.js`
7. `test/artifact-registry-view.integration.test.ts`
8. `test/artifact-registry-canonical.integration.test.ts`
9. `test/task-ledger-projection.integration.test.ts`

## 2. Findings
### 2.1 [P1] Canonical sqlite loss now fails open by silently rebuilding from rendered CSV
- 位置: `scripts/governance/artifact-registry-canonical.js:161`
- 问题描述: `readArtifactRegistryCanonicalState()` is now both the default read path and the implicit migration path. Whenever the sqlite registry is empty, it reads `artifacts.csv` / `artifacts.archive.csv` and repopulates sqlite in-place before returning. `check-artifact-registry-lifecycle.js` then only emits an informational line when this happened instead of failing. In practice, deleting or corrupting the supposed canonical sqlite file no longer surfaces as a blocking cutover error; the gate re-promotes the rendered compatibility views back into canonical truth and continues.
- 影响: This breaks the new “sqlite is canonical, CSV is rendered view” contract. Accidental loss of canonical state can pass governance checks unnoticed, and read-only commands now mutate repository state while masking the underlying durability failure the sprint is supposed to detect.
- 建议: Split bootstrap/migration from normal reads. `readArtifactRegistryCanonicalState()` should fail closed when sqlite truth is missing or empty unless an explicit migration/rebuild command opted into bootstrap mode. The lifecycle gate should treat `bootstrappedFromCsv` as a blocking failure after cutover, not an info line.

### 2.2 [P2] Artifact-registry view integration test is non-hermetic and mutates the real workspace
- 位置: `test/artifact-registry-view.integration.test.ts:5`
- 问题描述: The new integration test shells out to `render-artifact-registry-view.js` in `cwd: process.cwd()` with default options. That script now calls `readArtifactRegistryCanonicalState()` and `renderArtifactRegistryCsvViews()` in write mode, so running the test can create `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite` and rewrite the tracked rendered CSV views in the actual repository instead of an isolated temp fixture.
- 影响: Test execution can dirty the working tree and hide mutations behind a passing test run. That is especially risky here because the same script is part of migration/cutover governance, so the test no longer just verifies output; it can change the canonical/read-model state of the repository being reviewed.
- 建议: Make the test hermetic. Either run the script against a temp workspace with explicit `--database/--main/--archive` overrides, or add a true read-only mode to the renderer and use that in the test.

## 3. Notes
1. 你消息里贴的旧 finding `packages/core-session/src/shared-session-manager.ts:107-147` 我顺手复核了，当前 working tree 里没有复现：`SharedSessionManager` 现在已经通过 session-level mutation lock 串行化 append/update/finalize，并且有并发回归测试覆盖。
2. 这轮我重点看了 sqlite canonical truth、rendered CSV view、task-ledger projection 三条线的交叉边界；目前最主要的风险集中在“read path 兼任 bootstrap path”导致的 fail-open 行为，而不是 `SqliteArtifactIndexStore` 自身的 upsert 语义。

## 4. Verification
1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/artifact-registry/test/artifact-registry.unit.test.ts test/artifact-registry-view.integration.test.ts test/artifact-registry-canonical.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-02）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Canonical sqlite loss now fails open by silently rebuilding from rendered CSV`
   - 判定：**认可**
   - 证据：`readArtifactRegistryCanonicalState()` 之前确实会在 sqlite 为空时自动把 rendered CSV 回填进 canonical sqlite，并由 `check-artifact-registry-lifecycle.js` 只输出 info。当前已改为默认 fail-closed：只有显式 `bootstrapFromCsv`/`--bootstrap-from-csv` 才允许回填；否则当 rendered CSV 仍有数据时直接报错。
   - 处理：已修复。
2. `2.2 [P2] Artifact-registry view integration test is non-hermetic and mutates the real workspace`
   - 判定：**认可**
   - 证据：原测试确实直接在仓库根目录执行 `render-artifact-registry-view.js` 并使用默认路径，存在创建/改写真实 workspace artifact-registry state 的风险。当前测试已改为 temp workspace 隔离用例，并通过显式 `--database/--main/--archive --skip-write` 运行 renderer。
   - 处理：已修复。

### 验证命令
1. `pnpm exec biome check scripts/governance/artifact-registry-canonical.js scripts/governance/render-artifact-registry-view.js scripts/governance/check-artifact-registry-lifecycle.js scripts/governance/reconcile-artifact-dependencies.js scripts/governance/compact-artifact-registry.js test/artifact-registry-view.integration.test.ts test/artifact-registry-canonical.integration.test.ts`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/artifact-registry/test/artifact-registry.unit.test.ts test/artifact-registry-view.integration.test.ts test/artifact-registry-canonical.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
4. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`（通过）
5. `pnpm run build`（通过）

## 修复执行记录（2026-04-02）

1. `2.1 [P1] Canonical sqlite loss now fails open by silently rebuilding from rendered CSV`：已完成
   - 变更文件：`scripts/governance/artifact-registry-canonical.js`、`scripts/governance/check-artifact-registry-lifecycle.js`、`scripts/governance/render-artifact-registry-view.js`、`scripts/governance/reconcile-artifact-dependencies.js`、`scripts/governance/compact-artifact-registry.js`、`test/artifact-registry-canonical.integration.test.ts`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/artifact-registry/test/artifact-registry.unit.test.ts test/artifact-registry-view.integration.test.ts test/artifact-registry-canonical.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`、`node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`、`pnpm run build`（通过）
   - 说明：canonical sqlite 默认读路径现在 fail-closed；只有显式 opt-in bootstrap 才允许从 rendered CSV 重建。
2. `2.2 [P2] Artifact-registry view integration test is non-hermetic and mutates the real workspace`：已完成
   - 变更文件：`test/artifact-registry-view.integration.test.ts`、`scripts/governance/render-artifact-registry-view.js`
   - 验证：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/artifact-registry/test/artifact-registry.unit.test.ts test/artifact-registry-view.integration.test.ts test/artifact-registry-canonical.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：view renderer 测试已完全切到 temp workspace，不再读写真实仓库的 canonical/rendered artifact state。
