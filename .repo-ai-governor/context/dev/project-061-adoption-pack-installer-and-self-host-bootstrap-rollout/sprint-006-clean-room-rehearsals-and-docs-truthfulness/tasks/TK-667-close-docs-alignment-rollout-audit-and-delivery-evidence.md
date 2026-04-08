# TK-667 close docs alignment rollout audit and delivery evidence

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-006-clean-room-rehearsals-and-docs-truthfulness`

## 1. 任务目标

在 clean-room rehearsal 通过后，收口 README / playbook / support matrix truthfulness、project audit 与 delivery evidence。

## 2. Depends On

1. `TK-666`

## 3. 预期产物

1. docs truthfulness sync
2. rollout audit
3. delivery closeout evidence

## 4. Required Inputs

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/support-matrix.md`
5. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/TK-666-run-clean-room-adopter-and-self-host-rehearsals-plus-truthfulness-evidence-refresh.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/project-060-adoption-pack-promotion-and-decomposition-completion-audit-summary.md`

## 6. 实施计划

1. 依据 rehearsal evidence 刷新 docs truthfulness。
2. 生成 project-level rollout audit 与 delivery closeout evidence。
3. 完成 `project-061` completion audit、delivery registry closeout 与 support matrix refresh。

## 7. Development Verification

1. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已将 README、本地 adoption playbook 与 support matrix 对齐到真实 `adopt` / self-host / host-export 边界，并把 project-061 clean-room truthfulness evidence 回链到公开文档面。
3. 2026-04-09：已补齐 `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout-completion-audit-summary.md`，并将 support matrix clean-room evidence timestamp 刷新到最新 `dist` 构建后的 clean-room summary。

## 10. 产出

1. 已完成：`README.md` 与 `README.zh-CN.md`
2. 已完成：`docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md`
3. 已完成：`docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md`
4. 已完成：`.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout-completion-audit-summary.md`
