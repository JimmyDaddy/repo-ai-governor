# Code Review: sprint-002 ownership and generated-artifact policy

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-003`
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

## 2. Findings
### 2.1 [P1] missing self-host canonical surfaces could pass clean and be silently reseeded on upgrade
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:1488`
- 问题描述: `buildDiffRecords()` 仅对 `enforce_checksum` surface 生成 drift，因此删除 `canonical_runtime_writable` / `starter_editable` 文件后，`adopt diff` 和 `adopt verify` 可能仍显示 clean，而 `adopt upgrade` 会把缺失的 seed/template 静默补回。
- 影响: self-host repo-local canonical truth 丢失时，operator 既看不到明确 drift，也可能被 `upgrade` 无提示重种，违反 sprint-002 想 formalize 的 ownership / recovery boundary。
- 建议: 对 missing-file drift 做 ownership-aware handling；至少让缺失的 `canonical_runtime_writable` surface 在 `diff/verify` 中显式失败，并阻止 `upgrade` 无提示重建。

### 2.2 [P2] ownership-policy regression tests missed the deleted-file branch
- 位置: `apps/cli/test/adopt-command.integration.test.ts:1589`
- 问题描述: 现有回归只覆盖“内容被编辑但不算 drift”和“remove fail-closed”，没有覆盖删除 `starter_editable` / `canonical_runtime_writable` surface 后的 `diff/verify/upgrade` 行为。
- 影响: 最危险的 fail-open 分支没有自动化信号，导致当前绿色测试仍可能放过 silent reseed regression。
- 建议: 增补删除场景集成测试，断言 `diff/verify` 暴露 missing drift，且 `upgrade` 不会静默补种。

## 3. Notes
1. 本轮 fresh reviewer 返回 1 个 `P1` 与 1 个 `P2` actionable findings，主 agent 逐条复核后均予以接受。
2. 这轮修复仍严格留在 sprint-002 的 ownership / drift / recovery boundary 内，不提前切入 sprint-003 的 activation phase 设计。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`buildDiffRecords()` 对非 `enforce_checksum` surface 直接跳过，确实让 `governor.yaml`、sqlite/csv registry 等缺失时漏出 clean path；`writeManagedTextFile()` 在文件缺失时也会直接写入新 seed。
   - 处理：已接受并修复，为 missing-file drift 增加 ownership-aware handling：`starter_editable` / `canonical_runtime_writable` 缺失现在会进入 diff/verify fail path，其中 `canonical_runtime_writable` 需要显式 recovery，`upgrade/apply` 不再静默补种。

2. `2.2`
   - 判定：**认可**
   - 证据：原有 sprint-002 回归只覆盖 edited-content branch，没有删除 self-host surface 的 automated coverage。
   - 处理：已接受并修复，新增删除 `code_standards.md` 与 `governor.yaml` 后的 `adopt diff / verify / upgrade` 集成测试，断言 missing drift 被暴露且 upgrade fail-closed。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：将缺失 self-host surface 从“内容可变”语义中分离出来，显式纳入 diff/verify drift，并阻止 `canonical_runtime_writable` 缺失时被 `upgrade`/`apply` 静默重建。

2. `2.2`：已完成
   - 变更文件：`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
   - 说明：补齐删除 starter/canonical self-host surface 的 fail-open regression coverage，确保 sprint-002 ownership policy 覆盖 content-edit 与 file-missing 两条分支。
