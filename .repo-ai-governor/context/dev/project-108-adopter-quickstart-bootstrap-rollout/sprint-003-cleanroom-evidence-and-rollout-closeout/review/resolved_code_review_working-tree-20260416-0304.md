# Code Review: project-108 final closeout round 6

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-006`
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

### 2.1 [P2] English playbook still centers host follow-up on `adopt apply`

- 位置: `docs/local-adoption-playbook.md:293`
- 问题描述: 英文 adopter playbook 仍把 `host export` / `host verify` / `host pack` 表述为“位于主要 `adopt apply` 安装主线之下”，但当前 closeout window 里的 README、support matrix 与中文 playbook 都已经把 `adopt bootstrap` 固定为首选 quickstart，并把 `adopt apply` 下沉为显式 lower-level install surface。
- 影响: 英文 adopter-facing guidance 会与同窗 support truth 不一致，用户可能继续把 `adopt apply` 当成默认安装入口。
- 建议: 将该行同步到与 README/support matrix 一致的口径，明确 `adopt bootstrap` 是 preferred quickstart，`adopt apply` 是 explicit lower-level install surface。

### 2.2 [P2] Sprint-002 provenance still records the superseded bootstrap contract

- 位置: `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks/TK-903-implement-adopt-bootstrap-orchestrator-and-default-built-in-resolution.md:59`
- 问题描述: `TK-903` 的 canonical 执行记录仍写着 `adopt bootstrap` 按 `init -> doctor --fix -> adopt apply -> adopt verify` 固定编排，但 project-final round 3 已把最终 contract 收紧为 bootstrap 专属 doctor preflight 与 additive diagnostics truth。
- 影响: project 自身的 closeout provenance 会同时保留两套 bootstrap contract，削弱最终审计链路的一致性。
- 建议: 先修 canonical `TK-903` 任务卡，再通过 `sync-task-ledger.js` 重渲染 sprint-002 的 `checklist.md` 与 `tasks.csv`。

## 3. Notes

1. fresh reviewer 未报告新的 runtime/test blocker；本轮剩余风险集中在 docs truthfulness 与 project provenance drift。
2. 由于 `TK/CR` 是 semantic truth，本轮需要先修 `TK-903` 再回写 sprint-002 的派生台账。

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
   - 证据：`README.md` 与 `docs/support-matrix.md` 已统一把 built-in `adopt bootstrap` 声明为 preferred quickstart，英文 playbook 仍残留 “main adopt apply installation story” 的旧口径。
   - 处理：同步 `docs/local-adoption-playbook.md` 的 host follow-up 说明，使其与 README、support matrix 和中文 playbook 保持同窗 truthfulness。

2. `2.2`
   - 判定：**认可**
   - 证据：`TK-903` 的 canonical 执行记录仍保留 `doctor --fix` 旧编排，而本 project-final closeout 已依赖 bootstrap-doctor preflight / additive diagnostics truth 完成 consumer-facing 对齐。
   - 处理：更新 `TK-903` 的 canonical 执行记录，明确最终 contract 为 bootstrap 专属 doctor preflight + convenience install orchestration + additive diagnostics，然后重渲染 sprint-002 checklist/CSV。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`docs/local-adoption-playbook.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`（通过）
   - 说明：已将英文 playbook 的 host follow-up 描述同步为“`adopt bootstrap` 是 preferred quickstart，`adopt apply` 是 explicit lower-level install surface”，与 README、support matrix 和中文 playbook 对齐。

2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks/TK-903-implement-adopt-bootstrap-orchestrator-and-default-built-in-resolution.md`、`.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks/checklist.md`、`.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks/tasks.csv`
   - 验证：`node ./scripts/governance/sync-task-ledger.js --tasks-dir .repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
   - 说明：已先修 canonical `TK-903` 执行记录，再重渲染 sprint-002 的 checklist/CSV，把旧的 `doctor --fix -> adopt apply -> adopt verify` provenance 收口到最终 bootstrap-doctor preflight / additive diagnostics contract。

## 处置结果与剩余风险

1. 当前 round 的 `2` 条 accepted findings 已全部修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项；project-final scope 已满足进入最终 closeout write-back 的条件。
