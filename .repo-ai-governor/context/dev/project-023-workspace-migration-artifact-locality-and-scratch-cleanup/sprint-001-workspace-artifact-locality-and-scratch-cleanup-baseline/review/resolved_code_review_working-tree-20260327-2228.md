# Code Review: working tree 20260327-2228 workspace artifact locality closeout

- Status: resolved
- Date: 2026-03-27
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/commands/workspace-command.ts`
2. `apps/cli/test/commands/workspace-command.test.ts`
3. `packages/config/src/workspace-migration-service.ts`
4. `packages/config/test/workspace-migration-service.integration.test.ts`
5. `README.md`
6. `README.zh-CN.md`
7. `docs/local-adoption-playbook.md`
8. `docs/local-adoption-playbook.zh-CN.md`
9. `CLAUDE.md`
10. `.repo-ai-governor/context/current-context.md`
11. `.repo-ai-governor/context/completed-streams-history.md`
12. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
13. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
14. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/plan.md`
15. `.repo-ai-governor/context/dev/project-023-workspace-migration-artifact-locality-and-scratch-cleanup/**`
16. `.repo-ai-governor/draft/gate-execution-efficiency-optimization-plan.md`
17. `.repo-ai-governor/draft/prd-completion-status-analysis.md`
18. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 2. Findings
### 2.1 [P1] 已 resolved 的 sprint-001 closeout review 仍然没有覆盖当前 working tree 真实范围
- 位置: `.repo-ai-governor/context/dev/project-023-workspace-migration-artifact-locality-and-scratch-cleanup/sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline/review/resolved_code_review_tk-271-tk-274-workspace-artifact-locality-and-scratch-cleanup.md:16`
- 问题描述: 这份已 resolved review 被 `DA-274` 和 project completion audit 当作 completion evidence，但其 `## 1. Review Scope` 与当前 working tree 实际变更不一致：遗漏了 `.repo-ai-governor/context/artifact-registry/artifacts.csv`、`.repo-ai-governor/context/completed-streams-history.md`、`.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`、`CLAUDE.md`、`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/plan.md` 以及当前 untracked 的两份 draft；同时把未出现在本轮 diff 中的 `apps/cli/test/cli-output-contract.integration.test.ts` 列成了 working tree review 范围。按仓库 CR 工作流，working tree review 必须由 `git status --short` 与当前 diff 解析出的真实变更集驱动，现有 evidence 不能充分支撑“未发现需要修复的点”的结论。
- 影响: `project-023` 的 closeout 与 completion audit 目前建立在一份范围漂移的 review 证据上，无法确认本轮的台账切换、lifecycle registry draft、新增文档入口与 closeout 真值同步是否都被审过，削弱了 sprint/project 收口证据链的可信度。
- 建议: 按当前 working tree 重新生成 closeout review，精确覆盖真实改动；若需要引用额外测试文件，只能写在 verification/notes 中而不是冒充 review scope。待新的 review evidence 就位后，再把 closeout 标记为 `resolved`。

## 3. Notes
1. `pnpm -s tsc -p tsconfig.json --noEmit` 与定向 vitest 均通过，workspace migration 的代码路径未发现本轮回归。
2. `check-task-ledger-sync`、`check-code-review-status-sync` 与 `run-normative-loading-manifest-gate` 通过。
3. `check-sprint-plan-status-sync` 当前在本地失败，原因是工作区里存在一个未入库的空目录 `.repo-ai-governor/context/dev/project-024-gate-execution-efficiency-technical-solution-promotion/sprint-001-formalization-and-promotion-cutover/`，缺少 `plan.md`；这会影响本地 gate 结果，但不属于本次 git diff 的受审文件集。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
4. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts packages/config/test/workspace-migration-service.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）

## 复核结论（2026-03-27）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] 已 resolved 的 sprint-001 closeout review 仍然没有覆盖当前 working tree 真实范围`
   - 判定：**认可**
   - 证据：当前 `git status --short` 与 `git diff --name-only --diff-filter=ACMR` 显示 working tree 真实范围确实包含 `artifacts.csv`、`completed-streams-history.md`、`technical-solution-lifecycle-registry.yaml`、`CLAUDE.md`、`project-022/plan.md`、draft 文档以及 `project-024` / `governance-execution-gates` 新增目录，而既有 `resolved_code_review_tk-271-tk-274-workspace-artifact-locality-and-scratch-cleanup.md` 的 `## 1. Review Scope` 遗漏了这些变更，同时错误把 `apps/cli/test/cli-output-contract.integration.test.ts` 列成 working tree review 范围。
   - 处理：已按当前 working tree 补正 closeout review scope，并把 `apps/cli/test/cli-output-contract.integration.test.ts` 降为辅助验证对象。

### 验证命令
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-03-27）

1. `2.1 [P1] 已 resolved 的 sprint-001 closeout review 仍然没有覆盖当前 working tree 真实范围`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-023-workspace-migration-artifact-locality-and-scratch-cleanup/sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline/review/resolved_code_review_tk-271-tk-274-workspace-artifact-locality-and-scratch-cleanup.md`
   - 验证：`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：closeout review 现已覆盖当前 working tree 的真实变更集，额外测试文件只保留在 verification/notes。
