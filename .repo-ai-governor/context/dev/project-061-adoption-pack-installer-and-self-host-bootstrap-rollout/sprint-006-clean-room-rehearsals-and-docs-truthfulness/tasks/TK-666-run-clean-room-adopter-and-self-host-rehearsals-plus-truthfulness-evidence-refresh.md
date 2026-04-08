# TK-666 run clean-room adopter and self-host rehearsals plus truthfulness evidence refresh

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-006-clean-room-rehearsals-and-docs-truthfulness`

## 1. 任务目标

执行 adopter-complete 与 self-host-complete 的 clean-room rehearsal，并刷新与真实能力对应的 truthfulness evidence。

## 2. Depends On

1. `TK-665`

## 3. 预期产物

1. adopter clean-room rehearsal
2. self-host clean-room rehearsal
3. truthfulness evidence packet

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces/tasks/TK-665-bootstrap-repo-local-execution-workspace-sqlite-registries-and-governance-authoring-surfaces.md`
2. `docs/local-adoption-playbook.md`
3. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 分别执行普通 adopter 与 self-host clean-room rehearsal。
2. 捕获 install / verify / workspace bootstrap / drift / rollback truthfulness evidence。
3. 将证据回链到 docs 与 support matrix refresh。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已用构建后的 `dist/bin/repo-ai-governor.js` 重新执行 adopter / lifecycle / self-host clean-room rehearsal，并刷新受管安装、升级移除与 self-host bootstrap 的正式证据包。

## 10. 产出

1. 已完成：`.tmp/project-061-adoption-pack-cleanroom-summary.json`
2. 已完成：`.tmp/project-061-cleanroom-adopter/`
3. 已完成：`.tmp/project-061-cleanroom-self-host/` 与 `.tmp/project-061-cleanroom-lifecycle/`
