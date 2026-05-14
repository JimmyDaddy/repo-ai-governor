# Code Review: sprint-002 ownership and generated-artifact policy

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-001`
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
1. `packages/standards/src/constants/adoption-pack.constant.ts`
2. `packages/standards/src/constants/index.ts`
3. `packages/standards/src/index.ts`
4. `packages/standards/src/types/interfaces/adoption-pack.interface.ts`
5. `packages/standards/src/built-in-adoption-pack-catalog.ts`
6. `packages/standards/src/adoption-pack-registry.ts`
7. `apps/cli/src/runtime/adoption-pack-runtime.ts`
8. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings
### 2.1 [P1] `adopt upgrade` still failed closed on self-host writable surfaces that sprint-002 explicitly reclassified as non-drifting
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:638`
- 问题描述: 前置 `diff` 已只对 `managed_locked + enforce_checksum` surface 产生阻断，但真正写入时 `writeManagedTextFile()` 仍要求当前 checksum 与旧 receipt checksum 一致，导致 `starter_editable` / `canonical_runtime_writable` 的正常编辑在 `upgrade` 时继续触发 `STANDARDS_PACK_INVALID`。
- 影响: sprint-002 想要 formalize 的 ownership lifecycle 无法真正落地，operator 一旦编辑 `code_standards.md` 或 `governor.yaml`，后续 `adopt upgrade` 就会错误回退成 fail-closed。
- 建议: 让 write path 与 receipt ownership/drift 语义对齐，允许 editable/canonical runtime surfaces 在 upgrade 时保留现状，只对严格 managed-locked surface 继续执行 checksum overwrite guard。

### 2.2 [P2] self-host edited-file `upgrade` path lacked integration coverage
- 位置: `apps/cli/test/adopt-command.integration.test.ts:1589`
- 问题描述: 现有新测试只覆盖了 edited-file `diff` clean 与 clean-install `upgrade`，没有证明“编辑 self-host writable surface 后再次 `adopt upgrade`”这条路径可以成功且保持无 drift。
- 影响: round-1 的 P1 regression 缺少防回归信号，后续 ownership/refactor 很容易再次把 editable/canonical write path 打回 fail-closed。
- 建议: 补一条真实 self-host integration test，先编辑 `code_standards.md` 和 `governor.yaml`，再执行 `adopt upgrade` 与 `adopt diff`，断言 upgrade 成功、编辑被保留且 diff 仍 clean。

## 3. Notes
1. 本轮 fresh reviewer 返回 2 个 actionable findings，主 agent 逐条复核后均予以接受并在同一 change window 修复。
2. 这轮修复仍保持 sprint-002 的 formal scope，不提前触碰 sprint-003 的 activation/readiness truth owner split，也不提前 uplift public docs truth。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`upgrade()` 的 blocking diff 已按 ownership/drift policy 过滤，但 `writeManagedTextFile()` 仍以旧 checksum 作为统一覆盖前提，和 `contract.runtime.adoption-pack-install.v1` 对 `starter_editable` / `canonical_runtime_writable` 的 lifecycle 要求不一致。
   - 处理：已接受并修复，为 write path 增加 ownership-aware preserve logic，使 editable/canonical runtime surfaces 在 upgrade 中保留现状，仅对 strict managed-locked surface 继续执行 overwrite guard。

2. `2.2`
   - 判定：**认可**
   - 证据：原有集成测试只验证 `diff` clean，没有覆盖 edited self-host path 上的 `upgrade` 成功与后续 `diff` clean。
   - 处理：已接受并修复，新增 edited self-host `upgrade` 回归测试，验证 upgrade 成功、编辑内容保留且 diff 结果为空。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：让 managed write path 按 ownership semantics 区分“允许保留现状”和“允许受管覆盖”，避免 `starter_editable` / `canonical_runtime_writable` 在 upgrade 中继续被旧 checksum 误拦。

2. `2.2`：已完成
   - 变更文件：`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
   - 说明：补齐 edited self-host upgrade regression，确保 sprint-002 的 ownership/drift contract 在 `upgrade` 路径上也被真实守住。
