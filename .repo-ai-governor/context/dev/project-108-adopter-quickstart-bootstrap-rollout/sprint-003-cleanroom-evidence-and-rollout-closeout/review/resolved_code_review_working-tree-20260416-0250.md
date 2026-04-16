# Code Review: project-108 final closeout round 5

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-005`
- Review Type: project-final working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`
8. `apps/cli/src/commands/adopt-command.ts`
9. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
10. `apps/cli/src/runtime/adoption-pack-runtime.ts`
11. `packages/shared/src/i18n/locales/en-us.ts`
12. `packages/shared/src/i18n/locales/zh-cn.ts`
13. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings

### 2.1 [P2] Support matrix provenance still points at the previous verification window

- 位置: `docs/support-matrix.md:4`
- 问题描述: support matrix 已经同步到新的 `bootstrap doctor preflight` / bootstrap-doctor diagnostics contract，但 `Last updated`、scope 与最新 evidence row 仍停在 `2026-04-15`、`project-108 / sprint-002` 的旧验证窗口；中文 support matrix 也存在同样漂移。
- 影响: formal support truth 会对外宣称新的 quickstart contract，却把 provenance 继续回链到上一轮窗口，破坏 user-visible docs truthfulness 与 closeout 审计可追溯性。
- 建议: 在同一变更窗口同步刷新 `docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md` 的日期元数据、scope、verification snapshot 与 GA support truthfulness evidence row，使其回链到本轮实际复跑的 closeout 验证窗口。

## 3. Notes

1. fresh reviewer 未发现新的 code/runtime 级 actionable drift；当前剩余问题仅是 formal support provenance 没跟上最新 closeout window。
2. 修复后需要继续按 project-final CR lifecycle 复核并进入 fresh clean recheck，确认 support-truth closeout 后没有新的 actionable finding。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./.tmp/project-108-bootstrap-cleanroom.mjs`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：support matrix 已升级到新的 `bootstrap doctor preflight` / bootstrap-doctor diagnostics contract，但中英文文件的日期元数据、scope 与 project-108 top evidence row 仍停在 `project-108 / sprint-002` 的旧窗口，无法回链本轮 closeout 验证。
   - 处理：同步刷新 `docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md` 的 `Last updated/最后更新`、scope、verification snapshot header/top row、GA support truthfulness evidence row 与 note summary，使其回链到 `2026-04-15T18:47:55Z` 这轮实际复跑窗口。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（待推进 verified 后复跑）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待推进 verified 后复跑）
3. `node ./scripts/governance/check-code-review-status-sync.js`（待推进 verified 后复跑）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`（通过）
   - 说明：已将中英文 support matrix 的 `Last updated/最后更新`、scope、verification snapshot 与 GA support truthfulness evidence row 刷新到本轮实际 closeout 验证窗口，并把 `project-108` 的 support provenance 扩展到 `sprint-002 ~ sprint-003 / TK-903 ~ TK-908`。

## 处置结果与剩余风险

1. 当前 round 的 `1` 条 accepted finding 已完成修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项；下一步进入 fresh project-final clean recheck，确认 support matrix provenance 收口后没有新的 actionable drift。
