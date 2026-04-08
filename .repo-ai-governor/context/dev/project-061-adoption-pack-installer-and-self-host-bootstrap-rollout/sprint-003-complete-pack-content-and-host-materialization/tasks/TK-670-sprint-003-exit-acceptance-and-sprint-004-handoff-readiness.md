# TK-670 sprint-003 exit acceptance and sprint-004 handoff readiness

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-003-complete-pack-content-and-host-materialization`

## 1. 任务目标

在 `TK-660`、`TK-661` 完成后，补写 `sprint-003` 的 closeout 与 handoff truth，使 `project-061` 计划面和账面真值明确切换到 `sprint-004`。

## 2. Depends On

1. `TK-660`
2. `TK-661`

## 3. 预期产物

1. 更新后的 `sprint-003` / `project-061` 计划面
2. 同步后的 `sprint-003` canonical ledger 与 rendered views
3. 固定到 `sprint-004` 的 handoff truth

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/plan.md`
3. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/tasks/TK-660-publish-built-in-adopter-complete-pack-and-capability-coverage-map.md`
4. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/tasks/TK-661-materialize-shared-bootstrap-assets-and-host-specific-assets-through-installer.md`

## 5. Traceback References

1. `.repo-ai-governor/context/current-context.md`

## 6. 实施计划

1. 将 `sprint-003` 计划面收敛到 `completed` 真值。
2. 在 project WBS 中登记 `sprint-003 -> sprint-004` 的 handoff 状态。
3. 同步 `sprint-003` task ledger、checklist 与 `tasks.csv`。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：在 `TK-660` 与 `TK-661` 全部完成后回补 `sprint-003` closeout task，并将下一边界固定为 `sprint-004-diff-upgrade-remove-and-adoption-verify`。

## 10. 产出

1. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/plan.md`
2. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
