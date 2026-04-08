# TK-671 sprint-004 exit acceptance and sprint-005 handoff readiness

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-004-diff-upgrade-remove-and-adoption-verify`

## 1. 任务目标

在 `TK-662`、`TK-663` 完成后，补写 `sprint-004` 的 closeout 与 handoff truth，使 `project-061` 计划面和账面真值明确切换到 `sprint-005`。

## 2. Depends On

1. `TK-662`
2. `TK-663`

## 3. 预期产物

1. 更新后的 `sprint-004` / `project-061` 计划面
2. 同步后的 `sprint-004` canonical ledger 与 rendered views
3. 固定到 `sprint-005` 的 handoff truth

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-004-diff-upgrade-remove-and-adoption-verify/plan.md`
3. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-004-diff-upgrade-remove-and-adoption-verify/tasks/TK-662-implement-adopt-diff-upgrade-remove-lifecycle-and-drift-safe-update-policy.md`
4. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-004-diff-upgrade-remove-and-adoption-verify/tasks/TK-663-extend-adoption-verify-and-managed-bundle-artifact-support.md`

## 5. Traceback References

1. `.repo-ai-governor/context/current-context.md`

## 6. 实施计划

1. 将 `sprint-004` 计划面收敛到 `completed` 真值。
2. 在 project WBS 中登记 `sprint-004 -> sprint-005` 的 handoff 状态。
3. 同步 `sprint-004` task ledger、checklist 与 `tasks.csv`。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：在 `TK-662` 与 `TK-663` 全部完成后回补 `sprint-004` closeout task，并将下一边界固定为 `sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces`。

## 10. 产出

1. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-004-diff-upgrade-remove-and-adoption-verify/plan.md`
2. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
