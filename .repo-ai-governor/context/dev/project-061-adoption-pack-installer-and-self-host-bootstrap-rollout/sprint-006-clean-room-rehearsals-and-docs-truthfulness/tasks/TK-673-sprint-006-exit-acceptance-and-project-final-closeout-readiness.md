# TK-673 sprint-006 exit acceptance and project-final closeout readiness

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-006-clean-room-rehearsals-and-docs-truthfulness`

## 1. 任务目标

在 `TK-666`、`TK-667` 与 `CR-001` 收口后，完成 `sprint-006` 的 closeout 与 project-final-ready truth 写回。

## 2. Depends On

1. `TK-666`
2. `TK-667`
3. `CR-001`

## 3. 预期产物

1. 更新后的 `sprint-006` / `project-061` 计划面
2. `resolved` 状态的 project-final review artifact
3. 同步后的 `sprint-006` canonical ledger 与 rendered views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/plan.md`
3. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/TK-666-run-clean-room-adopter-and-self-host-rehearsals-plus-truthfulness-evidence-refresh.md`
4. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/TK-667-close-docs-alignment-rollout-audit-and-delivery-evidence.md`
5. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/CR-001.md`

## 5. Traceback References

1. `.tmp/project-061-adoption-pack-cleanroom-summary.json`

## 6. 实施计划

1. 将 `CR-001` 推进为 `resolved` 并固定 review artifact。
2. 将 `sprint-006` 计划面收敛到 `completed` 真值。
3. 在 project plan 中登记 `project-final closeout` readiness。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/standards/test/adoption-pack-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-09：delegated reviewer Franklin 在 round 1 提出 3 条 actionable finding：`adopt remove` drift fail-closed、project-061 closeout ledger sync、project completion audit 缺失。
2. 2026-04-09：主 agent 认可全部 findings，并在同一窗口完成代码修复、ledger/plan/audit write-back 与 final recheck，使 `sprint-006` 达到 project-final closeout-ready state。

## 10. 产出

1. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/review/resolved_code_review_working-tree-20260409-0305.md`
2. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/plan.md`
3. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
