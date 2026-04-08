# Code Review: project-061 adoption-pack installer and self-host bootstrap rollout final loop round 1

- Status: resolved
- Date: 2026-04-09
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated project-final working tree review
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

1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `project-061` closeout plans, task cards, review artifacts, current-context, and completed-stream history
4. `README*`, `docs/local-adoption-playbook*`, `docs/support-matrix*`, and `.tmp/project-061-adoption-pack-cleanroom-summary.json`

## 2. Findings

### 2.1 [P1] `adopt remove --force` ignored managed-file drift and deleted user-modified files

- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:479`
- 问题描述: `remove` 的 guard 等价退化成仅检查 `!options.force`，导致 drifted managed file 在 `--force` 场景下也会被直接删除。
- 影响: 违背 `TK-662` 中声明的 fail-closed drift-safe contract，并造成不可逆的用户修改丢失风险。
- 建议: 对 drift 维持阻断，并补齐 regression coverage 证明 clean remove 仍可用。

### 2.2 [P2] project-061 closeout ledger was not synchronized

- 位置: `sprint-006/tasks/CR-001.md`、`sprint-006/tasks/checklist.md`、`sprint-006/tasks/tasks.csv`、`sprint-006/plan.md`
- 问题描述: project-final CR surface 一度缺少 `CR-001` canonical row，`TK-666/TK-667` 仍停留在 placeholder `result/verify/review_delta`，同时 sprint/project plans 仍保留 pre-closeout status。
- 影响: 违反 `CS-004`、`CS-021` 与 task-ledger single write source contract，导致 closeout-ready truth 不可审计。
- 建议: 补齐 closeout tasks、completion audit、plan status write-back，并同步 canonical ledger / checklist / `tasks.csv`。

### 2.3 [P2] project-level completion audit was missing

- 位置: `sprint-006/plan.md`、`TK-667`、`project-061/plan.md`
- 问题描述: sprint-006 已宣称 project closeout 和 completion audit ready，但 project root 尚无对应 completion audit summary，也没有里程碑回链。
- 影响: 不满足 AGENTS 与 project-closure protocol 对 project completion claim 的硬性要求。
- 建议: 生成 project-level completion audit summary，并在 project plan 中新增 milestone backlink。

## 3. Notes

1. delegated reviewer `Franklin` 在 round 1 提交了以上 3 条 actionable finding；主 agent 已逐条复核并全部接受。
2. 所有 findings 均在同一 change window 内完成修复、recheck 和 final closeout write-back。

## 复核结论（2026-04-09）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`remove` guard 已修正为 `diffRecords.length > 0 || !options.force`；integration test 已覆盖 drift remove fail 与 clean remove pass。
   - 处理：已接受并修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`TK-668 ~ TK-674`、`CR-001`、`project/sprint plan`、`current-context`、`completed-streams-history` 已完成同窗口 write-back，并同步 task ledger。
   - 处理：已接受并修复。
3. `2.3`
   - 判定：**认可**
   - 证据：`project-061-adoption-pack-installer-and-self-host-bootstrap-rollout-completion-audit-summary.md` 已创建，并在 `project-061/plan.md` 中新增里程碑记录入口。
   - 处理：已接受并修复。

### 验证命令

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/standards/test/adoption-pack-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-09）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/standards/test/adoption-pack-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`（通过）
   - 说明：恢复 `adopt remove` 的 drift fail-closed 语义，同时保留 clean remove 行为。
2. `2.2`：已完成
   - 变更文件：`project-061` project/sprint plans、`current-context.md`、`completed-streams-history.md`、`project-061` task cards / review artifacts / derived ledgers
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：补齐 closeout tasks、canonical ledger write-back、plan status truth 与 completion-context routing。
3. `2.3`：已完成
   - 变更文件：`project-061-adoption-pack-installer-and-self-host-bootstrap-rollout-completion-audit-summary.md`、`project-061/plan.md`
   - 验证：`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：补齐 project-level completion audit summary 与 milestone backlink，恢复 project closeout claim truthfulness。
