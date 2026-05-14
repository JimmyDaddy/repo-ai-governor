# Code Review: sprint-002 ownership and generated-artifact policy

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `scripts/governance/sync-task-ledger.js`
4. `test/sync-task-ledger.integration.test.ts`

## 2. Findings
### 2.1 [P1] force upgrade could overwrite canonical runtime truth
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:1949`
- 问题描述: `writeManagedTextFile()` 在 `--force` 分支里只保留缺失文件保护，却没有继续尊重 `canonical_runtime_writable` 的 preserve 语义，导致 edited `governor.yaml` 可能被 seed 内容覆写。
- 影响: self-host repo_local 的 runtime truth 会在 `adopt upgrade --force` 下被静默重置，违背 sprint-002 刚建立的 provenance-only / non-destructive ownership contract。
- 建议: 对 `canonical_runtime_writable` surface 无论是否 `--force` 都保持 preserve-or-block 语义，并补齐 force-upgrade regression coverage。

### 2.2 [P2] ledger gap regression test did not enter the old failing path
- 位置: `test/sync-task-ledger.integration.test.ts:172`
- 问题描述: 新增 gap test 只在 CSV 文本里伪造 `seed-4` 这类 execution id，但 projected row number 仍按物理行顺序计算，因此旧的 `rows.length + 2` 实现也会通过。
- 影响: `sync-task-ledger` 的 multi-round CR 覆盖 bug 缺少真实防回归保护，仍可能在后续 closeout / CR 循环中再次污染 canonical/rendered ledger。
- 建议: 从 sqlite canonical source 直接制造非连续 `source_row_number` 缺口，再断言连续追加不会复用旧 gap。

## 3. Notes
1. 本轮 fresh reviewer 返回 1 个 `P1` 与 1 个 `P2` actionable findings，主 agent 逐条复核后均予以接受。
2. 本轮修复仍严格收敛在 sprint-002 的 ownership/drift semantics 与台账工具链稳定性边界内，不提前进入 sprint-003 的 activation/readiness owner split 实现。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm exec vitest run test/sync-task-ledger.integration.test.ts`（通过）
3. `pnpm run build`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`writeManagedTextFile()` 仅在 `!force` 分支里调用 preserve 判定，确实让 `canonical_runtime_writable` surface 在 `adopt upgrade --force` 时退化成可覆写 seed。
   - 处理：已接受并修复，将 preserve 判定前移到 `force` 分支之前，使 `canonical_runtime_writable` 与 edited `starter_editable` surface 在 forced upgrade 下仍保留现有真值。

2. `2.2`
   - 判定：**认可**
   - 证据：原测试中的 projected row number 仍按 CSV 物理行顺序变成 `2/3/4`，没有触发旧实现真正失败的 gap 场景。
   - 处理：已接受并修复，测试改为先 seed sqlite canonical source，并显式写入 `source_row_number=2/4/7` 的缺口，再断言连续追加落到 `8/9`。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm exec vitest run test/sync-task-ledger.integration.test.ts`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`、`pnpm run build`（通过）
   - 说明：确保 `adopt upgrade --force` 不会覆写 edited `canonical_runtime_writable` self-host truth，并补齐 force-upgrade regression coverage。

2. `2.2`：已完成
   - 变更文件：`test/sync-task-ledger.integration.test.ts`
   - 验证：`pnpm exec vitest run test/sync-task-ledger.integration.test.ts`（通过）
   - 说明：将 ledger regression 改为真实 sqlite `source_row_number` gap 场景，确保旧实现无法伪通过。
