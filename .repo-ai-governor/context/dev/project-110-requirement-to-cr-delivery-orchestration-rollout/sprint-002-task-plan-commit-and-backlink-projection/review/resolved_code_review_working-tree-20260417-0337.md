# Code Review: sprint-002 task plan commit and backlink projection round 1

- Status: resolved
- Date: 2026-04-17
- Reviewer: Hooke delegated reviewer, verified by AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
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
1. `apps/cli/src/commands/plan-command.ts`
2. `apps/cli/src/constants/cli-session-shell-delivery-workflow.constant.ts`
3. `apps/cli/src/react-cli/views/transcript-pane.tsx`
4. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
6. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
7. `apps/cli/src/types/index.ts`
8. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
9. `apps/cli/src/types/interfaces/index.ts`
10. `apps/cli/test/runtime/react-cli-runner.test.ts`
11. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
12. `apps/cli/test/runtime/session-shell-runner.test.ts`
13. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
14. `packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts`
15. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
16. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
17. `packages/shared/src/i18n/locales/en-us.ts`
18. `packages/shared/src/i18n/locales/zh-cn.ts`
19. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/plan.md`
20. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks/TK-927-land-task-plan-preview-commit-bridge-and-durable-backlink-projection.md`
21. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks/CR-001.md`
22. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks/checklist.md`
23. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks/tasks.csv`

## 2. Findings
### 2.1 [P2] `/plan sync` preview-to-commit bridge exposed a pending action without a confirmable handoff
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
- 问题描述: `plan` preview 结果会把 delivery pending action 推进到 `confirm_task_plan_commit`，但 `/plan sync` 仍按 direct handoff 清空 pending preview，导致 shell 显示“待确认”却没有任何 `/confirm` 可执行状态。
- 影响: session shell 的 preview -> commit 桥接在最关键的 confirm 边界上不可恢复，和本 sprint 要求的 governed bridge 不一致。
- 判定: **认可**（risk-based inference）

### 2.2 [P2] delivery pending-action literals were still scattered inline
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
- 问题描述: `confirm_task_plan_commit`、`refine_task_plan_preview`、`start_task_driven_execution_flow`、`refine_task_plan_preview_or_reconfirm` 作为闭集业务值被直接写在 presenter 逻辑中。
- 影响: 违反 `CS-009`，并增加 CLI 投影与 orchestration truth 静默漂移的风险。
- 判定: **认可**

### 2.3 [P3] merged execution-details summary count was stale after delivery details were appended
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
- 问题描述: `mergeDetailsBlock()` 合并 delivery details 后没有重算 `summaryLine`，折叠态条目数会停留在旧值，直到用户手动 toggle 才刷新。
- 影响: command recap 的 presenter surface 会对实际 details 数量给出错误摘要。
- 判定: **认可**

### 2.4 [P3] transcript backlink section introduced hardcoded English copy
- 位置: `apps/cli/src/react-cli/views/transcript-pane.tsx`
- 问题描述: 新增的 backlink 区块把 `Related` 直接写成硬编码英文。
- 影响: 违反 `CS-033`，并让 `zh-CN` session shell 在新的 delivery backlink surface 上继续显示英文。
- 判定: **认可**

## 3. Notes
1. 本轮 fresh reviewer `Hooke` 在 sprint-002 范围内返回 4 个 actionable finding；主 agent 复核后均判定为接受并在同窗口修复。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/react-cli-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，5 files / 129 tests）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（待本轮 review/task 同步后复跑）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待本轮 review/task 同步后复跑）
6. `node ./scripts/governance/check-worktree-review-target.js`（待本轮 review/task 同步后复跑）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 处理：在 direct `plan` preview 成功后补上 confirmation-gated follow-up handoff；shell 现在会重新 arm `plan commit ... --confirm-plan approve` 的 pending preview，并让内建 `/confirm` 真正执行 commit。
2. `2.2`
   - 判定：**认可**
   - 处理：新增 `apps/cli/src/constants/cli-session-shell-delivery-workflow.constant.ts`，把 sprint-002 新增的 delivery pending-action 闭集统一收敛到 constants。
3. `2.3`
   - 判定：**认可**
   - 处理：`mergeDetailsBlock()` 现在会基于合并后的去重 lines 重新计算 collapsed summary line，并补了 transcript-store 回归测试。
4. `2.4`
   - 判定：**认可**
   - 处理：把 transcript backlink 标题切换为 `backlinksTitle` presenter field，并通过 i18n key `cli.sessionShell.responses.relatedLinksTitle` 提供多语言文案。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/react-cli-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，5 files / 129 tests）

## 风险与后续
1. accepted finding 的代码修复已完成，但 sprint-002 是否已经 clean 仍需新的 fresh reviewer recheck round 再确认。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`、`apps/cli/src/types/interfaces/cli-session-shell.interface.ts`、`apps/cli/src/types/interfaces/index.ts`、`apps/cli/src/types/index.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`
   - 说明：preview ready 时会 arm follow-up pending command，并让 `/confirm` 执行真实 `plan commit`。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/constants/cli-session-shell-delivery-workflow.constant.ts`、`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
   - 说明：把新引入的 delivery pending-action 值从 presenter 逻辑中抽离为集中常量。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
   - 说明：details merge 现在会重新计算 collapsed summary count，避免折叠态条目数漂移。
4. `2.4`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/transcript-pane.tsx`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`、`apps/cli/test/runtime/session-main-parity.integration.test.ts`
   - 说明：backlink 标题改为 i18n-backed presenter field，不再在 React view 里硬编码英文。

## 处置结果与剩余风险
1. `CR-001` 的 4 个 accepted finding 已全部修复并完成同窗口 build + targeted tests。
2. sprint-002 下一步进入新的 fresh reviewer clean recheck round；若 round-2 返回 `No actionable findings.`，即可开始 sprint closeout。
