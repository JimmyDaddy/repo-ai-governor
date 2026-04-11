# TK-774 finalize project-085 closeout after connect remote_api command authoring

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-085-command-based-remote-api-configuration`
- Sprint: `sprint-001-connect-command-remote-api-authoring`

## 1. 任务目标

在 `TK-773` 完成后收口 project/sprint closeout，补齐 completion audit，并把当前执行流同步回最终真值。

## 2. Depends On

1. `TK-773`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/plan.md`

## 3. 预期产物

1. project-085 completion audit summary
2. 完成态的 project/sprint plan 与台账
3. 恢复后的 `current-context.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
4. `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/sprint-001-connect-command-remote-api-authoring/plan.md`
2. `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/sprint-001-connect-command-remote-api-authoring/tasks/TK-773-add-command-based-remote-api-authoring-to-connect-onboarding-flow.md`

## 6. 实施计划

1. 汇总 `TK-773` 的交付证据与最终命令能力边界。
2. 生成 project-level completion audit summary，并把 project/sprint 状态切回 completed。
3. 同步 sqlite canonical ledger、`checklist.md`、`tasks.csv` 与 `current-context.md`。

## 7. Development Verification

1. 不适用，closeout 任务不单独引入新的 executable surface。

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-774 --tasks-dir ".repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/sprint-001-connect-command-remote-api-authoring/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：`TK-773` 已完成，并通过 targeted vitest 与 `pnpm run build` 验证。
3. 2026-04-11：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `project-085 / sprint-001` 从 `current-context.md` active primary stream 迁入 completed history。
4. 2026-04-11：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。

## 10. 产出

1. 已完成：project-085 completion audit summary -> `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/project-085-command-based-remote-api-configuration-completion-audit-summary.md`
2. 已完成：completed history and idle-context write-back -> `.repo-ai-governor/context/current-context.md`、`.repo-ai-governor/context/completed-streams-history.md`
3. 已完成：final plan closeout sync -> `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/plan.md`、`.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/sprint-001-connect-command-remote-api-authoring/plan.md`
