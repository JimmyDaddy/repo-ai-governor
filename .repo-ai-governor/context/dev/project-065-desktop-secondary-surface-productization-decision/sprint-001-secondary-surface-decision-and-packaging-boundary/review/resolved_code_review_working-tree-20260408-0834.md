# Code Review: project-065 sprint-001 desktop foundation-only boundary recheck

- Status: resolved
- Date: 2026-04-08
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: working tree review
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

1. `.repo-ai-governor/context/dev/project-065-desktop-secondary-surface-productization-decision/sprint-001-secondary-surface-decision-and-packaging-boundary`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`
8. `apps/desktop/README.md`
9. `integrations/desktop/README.md`
10. `integrations/desktop/examples/README.md`
11. `scripts/release/verify-local-distribution.js`
12. `apps/cli/test/cli-governance-runtime.integration.test.ts`

## 2. Findings

### 2.1 [P2] Adopter playbook under-specifies the desktop foundation proof chain

- 位置: `docs/local-adoption-playbook.md:80-88`, `docs/local-adoption-playbook.zh-CN.md:80-88`, `docs/support-matrix.md:65`, `integrations/desktop/README.md:34`
- 问题描述: the adopter-facing desktop playbook described the “foundation verification chain above” as only `pnpm run build` plus `pnpm run check:desktop-entry-smoke`, while the canonical public support declaration still treated `release:verify-local` as part of the formal proof path.
- 影响: adopters could reasonably treat a weaker rehearsal as sufficient formal proof, which creates user-facing support-truth drift across the same project-065 boundary.
- 建议: add `pnpm run release:verify-local` to the playbook's formal desktop verification chain, and mirror the wording in the zh-CN playbook so the adopter contract matches the support matrix and desktop integration baseline.

## 3. Notes

1. The delegated reviewer relied on the already-passing build, test, and gate evidence supplied for this round and did not rerun commands independently.
2. No additional executable-code regressions were surfaced in `scripts/release/verify-local-distribution.js` or `apps/cli/test/cli-governance-runtime.integration.test.ts` during this recheck.

## 4. Verification

1. `pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:desktop-entry-smoke`（通过）
4. `node ./scripts/release/verify-local-distribution.js --output .tmp/project-065-sprint-001-desktop-foundation-report.json`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
7. `pnpm run check`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md` 现在都把 `pnpm run release:verify-local` 明确纳入 desktop foundation verification chain，且与 `docs/support-matrix.md`、`docs/support-matrix.zh-CN.md` 以及 `integrations/desktop/README.md` 的 formal proof path 保持一致。
   - 处理：接受该文档 contract drift finding，并将 adopter-facing wording 与 canonical support declaration 对齐。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm run check`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`（全部通过）
   - 说明：desktop foundation 的 adopter-facing verification chain 现已明确包含 `pnpm run release:verify-local`，与 support matrix 和 desktop integration baseline 保持同一条 formal proof contract。

## 处置结果与剩余风险

1. 本轮 fresh reviewer 唯一提出的 P2 文档 contract drift 已处理完成。
2. 当前无阻塞性剩余风险；`project-065 / sprint-001` 已满足进入 sprint closeout write-back 的 review 条件。
3. 若后续再次修改 desktop support-truth narrative 或 packaged/local distribution proof path，必须重新执行同一组 build/gate/ledger verification 后再重判 clean。
