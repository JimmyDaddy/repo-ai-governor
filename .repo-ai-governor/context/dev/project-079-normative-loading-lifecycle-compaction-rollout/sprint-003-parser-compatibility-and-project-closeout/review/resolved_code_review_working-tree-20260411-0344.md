# Code Review: project-079 project-final closeout surface

- Status: resolved
- Date: 2026-04-11
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated project-final review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
5. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/project-079-normative-loading-lifecycle-compaction-rollout-completion-audit-summary.md`
6. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/plan.md`
7. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/TK-760-finalize-project-079-closeout-and-completion-audit.md`
8. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/DA-760-project-079-final-closeout-and-active-stream-clearance.md`
9. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/tasks.csv`
11. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/review/resolved_code_review_working-tree-20260411-0255.md`

## 2. Findings
### 2.1 [P1] project-final closeout surface was cleared before `CR-002` resolved
- 位置: `.repo-ai-governor/context/current-context.md:5`, `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md:3`, `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/plan.md:3`, `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/tasks.csv:14`
- 问题描述: `current-context.md` 已切到 `idle` 且清空 `Active Streams`，project/sprint plan 也已提前写回 `completed`，但 `CR-002` 在 canonical task ledger 中仍是最新 `review_pending` 记录。`current-context.md -> Update Rules #4` 明确允许 final sprint 在最后一个 project-final `CR` `resolved` 前保持 active closeout surface；当前状态同时违反了该规则与 `CS-021` 的 sprint/task ledger 同步要求。
- 影响: project-final closeout truth 被提前终结，导致治理门禁把该 sprint 识别为 drift surface；`node ./scripts/governance/check-sprint-plan-status-sync.js` 已经实测失败，后续自动路由也会把仍有 open review 的项目误判为已完成。
- 建议: 先把 `project-079 / sprint-003` 恢复为 active closeout surface，并回滚 premature `completed` write-back、completed-history 迁移与 delivery `completed` truth；待 `CR-002` 收口为 `resolved` 后，再在同一 change window 重做最终 `completed` 写回。

## 3. Notes
1. 该 finding 直接命中 project-final lifecycle truth，不是低优先级文档措辞问题。

## 4. Verification
1. `node ./scripts/governance/check-sprint-plan-status-sync.js`（失败：`sprint-003` plan status=`completed` but latest `tasks.csv` indicates `active`）

## 复核结论（2026-04-11）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：已恢复 `current-context.md` active primary stream、移除 `completed-streams-history.md` 中提前登记的 `stream-project-079-sprint-003`、将 project/sprint plan 与 `TK-760` 恢复到 active closeout truth，并把 delivery handoff 调整回 in-progress closeout state。
   - 处理：accepted finding 已进入同窗口修复；待 `CR-002` 收口为 `resolved` 后，再执行最终 `completed` write-back。

### 验证命令
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js --format json`（失败，但仅剩无关的 `project-017` dirty registry entries；当前 review surface 内的 `project-079` stream registration 已恢复正常）
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 修复执行记录（2026-04-11）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/current-context.md`、`.repo-ai-governor/context/completed-streams-history.md`、`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`、`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/plan.md`、`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/TK-760-finalize-project-079-closeout-and-completion-audit.md`、`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/project-079-normative-loading-lifecycle-compaction-rollout-completion-audit-summary.md`、`.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/DA-760-project-079-final-closeout-and-active-stream-clearance.md`、`.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`（均通过）；`node ./scripts/governance/check-technical-solution-delivery-registry.js --format json` 仍报告无关的 `project-017` dirty registry issue
   - 说明：先恢复 active closeout surface 修复 premature-closeout drift，再在同一 change window 内于 `CR-002` 收口阶段重新执行最终 completed write-back。
