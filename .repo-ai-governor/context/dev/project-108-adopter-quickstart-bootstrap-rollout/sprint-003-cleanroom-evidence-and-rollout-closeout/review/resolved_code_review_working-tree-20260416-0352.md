# Code Review: project-108 final closeout round 8

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-008`
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
8. `apps/cli/src/main.ts`
9. `apps/cli/src/commands/adopt-command.ts`
10. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
11. `apps/cli/src/runtime/adoption-pack-runtime.ts`
12. `packages/config/src/workspace-resolver.ts`
13. `packages/config/src/types/interfaces/workspace.interface.ts`
14. `packages/shared/src/i18n/locales/en-us.ts`
15. `packages/shared/src/i18n/locales/zh-cn.ts`
16. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings

### 2.1 [P2] project-108 support-truth evidence time drifted away from the linked clean-room artifact

- 位置: `docs/support-matrix.md:170`, `docs/support-matrix.zh-CN.md:169`
- 问题描述: support matrix 仍把 `project-108` 的 installer/support claim 记为 `2026-04-15T18:47:55Z`，但当前回链的 `.tmp/project-108-adopt-bootstrap-cleanroom-summary.json` 已经在后续 rerun 中刷新到新的 `generatedAt`。正式 support row 因而引用了一个已被覆盖的 mutable artifact，却没有同步 evidence time / summary / backlink。
- 影响: project-final closeout 的 public support truth 无法稳定回放到一个确定的 clean-room 验证窗口，削弱 `CS-004` 要求的交付验证证据可追溯性。
- 建议: 在进入 final closeout 前，把中英文 support matrix 的 evidence time、summary 表述与 backlink 一起刷新到最新 clean-room rerun 的实际证据窗口，或改为引用一个不可变的归档 evidence path。

## 3. Notes

1. 除这条 provenance drift 外，本轮未再发现新的 code/runtime/docs/i18n actionable finding。
2. reviewer 提到 `bootstrap_doctor_diagnostics` 键名可能存在仓库外消费者兼容性风险，但当前仓库内 docs/tests/runtime 仍保持自洽；该项保留为 risk-based inference，不上升为本轮 actionable finding。

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
   - 证据：`docs/support-matrix*.md` 仍记录 `2026-04-15T18:47:55Z`，而 `.tmp/project-108-adopt-bootstrap-cleanroom-summary.json` 当前 `generatedAt` 已是 `2026-04-15T19:47:40.074Z`，support row 的 evidence window 已与实际回链产物失配。
   - 处理：刷新中英文 support matrix 的 installer/self-host bootstrap support row，把 evidence time、summary 里的 closeout-window 表述与 backlink 一起同步到最新 clean-room evidence window，再重跑必要验证后推进 `resolved`。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./.tmp/project-108-bootstrap-cleanroom.mjs`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：已把中英文 support matrix 的 installer/self-host bootstrap support row 刷新到最新 clean-room helper 产出的 `2026-04-15T20:04:40.834Z` evidence window，并同步更新 summary 中的 closeout-rerun 表述与 backlink，避免 public support truth 回链到已被覆盖的 mutable artifact。

## 处置结果与剩余风险

1. 当前 round 的 `1` 条 accepted finding 已修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项，但按照 `workspace-scoped-cr-loop` 与用户串行 closeout 契约，project-final closeout 仍需先完成 fresh `CR-009` clean recheck。
