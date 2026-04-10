# TK-758 sprint-002 exit acceptance and sprint-003 handoff readiness

- Status: planned
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P1
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-002-deprecated-compact-and-archive-integrity-automation`

## 1. 任务目标

完成 sprint-002 的 exit acceptance，确认 compact automation 与 archive integrity gate 已达到进入 parser/gate closeout sprint 的前置条件。

## 2. Depends On

1. `TK-753`
2. `TK-754`

## 3. 预期产物

1. sprint-002 acceptance note
2. sprint-003 activation recommendation
3. compact/gate handoff evidence

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/plan.md`
2. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/tasks/TK-753-implement-deprecated-grace-window-compaction-command-and-dry-run-report.md`
3. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/tasks/TK-754-add-archive-integrity-gate-and-monthly-audit-enforcement.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 汇总 sprint-002 的 compact、gate 与 monthly audit evidence。
2. 确认 parser/gate closeout 阶段的输入约束。
3. 准备 sprint-003 activation handoff。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：sprint-002 exit acceptance evidence
