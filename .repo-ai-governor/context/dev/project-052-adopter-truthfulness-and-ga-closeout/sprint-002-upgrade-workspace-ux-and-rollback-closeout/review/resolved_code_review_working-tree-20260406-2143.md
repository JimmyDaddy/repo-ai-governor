# Code Review: sprint-002-upgrade-workspace-ux-and-rollback-closeout round 1

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent fallback local recheck
- Task: `CR-001`
- Review Type: sprint scoped fallback recheck after delegated reviewer timeout
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

1. `apps/cli/src/commands/upgrade-command.ts`
2. `apps/cli/src/commands/workspace-command.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `apps/cli/test/commands/workspace-command.test.ts`
5. `apps/cli/test/cli-output-contract.integration.test.ts`
6. `README.md` / `README.zh-CN.md`
7. `docs/local-adoption-playbook.md` / `docs/local-adoption-playbook.zh-CN.md`
8. `docs/support-matrix.md` / `docs/support-matrix.zh-CN.md`
9. `TK-592` / `TK-593` / `TK-594`
10. `DA-592` / `DA-593` / `DA-594`
11. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`

## 2. Findings

### 2.1 [P2] Add explicit coverage for rollback snapshot rollback

- 位置: `apps/cli/test/cli-output-contract.integration.test.ts`
- 问题描述: 当前 sprint 已把 `upgrade rollback <apply-receipt-or-rollback-snapshot>` 固化成正式 adopter-facing 路径，但现有测试只覆盖 `apply receipt` 分支，尚未单独验证 `CliUpgradeCommand` 的 `rollback_snapshot` 分支。
- 影响: 若 rollback snapshot 分支退化，我们会在对外宣称已支持的 rollback hand-off 路径上缺少可执行证据，存在 contract truth 与实际保障不一致的风险。
- 建议: 增加一条 CLI output-contract 或 integration test，执行 `preview -> apply -> rollback <rollback-snapshot>`，并断言 `rollback_source_type=rollback_snapshot` 与 `verify_status=passed`。

## 3. Notes

1. 两位 fresh reviewer 子 agent 已按默认配置发起，但都在未产出 usable verdict 的情况下超时并 shutdown；本轮改按用户已批准的放宽策略执行主 agent fallback local recheck。
2. 在发现上述缺口前，本窗口已通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、治理同步检查与 `pnpm run check`。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）
8. `pnpm run check`（通过）

## 复核结论（2026-04-06）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`README*`、`docs/local-adoption-playbook*`、`docs/support-matrix*` 与 `DA-592/DA-593/DA-594` 已把 rollback snapshot 纳入正式 adopter rollback hand-off；仓库内检索只发现 `apply receipt` 分支的现有验证，未发现单独命中 `rollback_snapshot` 分支的测试。
   - 处理：补一条 `preview -> apply -> rollback <rollback-snapshot>` 的 CLI output-contract 测试，断言 `rollback_source_type=rollback_snapshot` 与 `verify_status=passed`。

## 风险与后续

1. 两位 fresh reviewer 子 agent 已按默认配置发起，但都在未产出 usable verdict 的情况下超时并 shutdown；本轮按用户已批准的放宽策略完成主 agent fallback recheck。
2. 下一步对认可项做最小安全修复，并重跑同窗口 build/test/check 基线后再推进到 `resolved`。

## 验证命令

1. `rg -n "rollback_snapshot_path|ROLLBACK_SNAPSHOT|upgrade rollback .*snapshot|rollbackSnapshotPath" apps packages test`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check`（通过）

## 修复执行记录（2026-04-06）

1. `2.1`：已完成
   - 变更文件：`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（均通过）
   - 说明：新增 `preview -> apply -> rollback <rollback-snapshot>` 的 CLI output-contract 测试，显式断言 `rollback_source_type=rollback_snapshot` 与 `verify_status=passed`。

## 处置结果与剩余风险（2026-04-06）

1. 已认可 finding 的修复与验证全部完成。
2. 当前 scope 未发现剩余 actionable finding。
3. fresh reviewer 超时导致本轮采用主 agent fallback recheck，但已按放宽策略完整记录原因、修复与最终验证结果。
