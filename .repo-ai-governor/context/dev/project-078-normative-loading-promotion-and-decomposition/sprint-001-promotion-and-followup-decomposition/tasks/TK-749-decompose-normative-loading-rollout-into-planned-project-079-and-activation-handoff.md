# TK-749 decompose normative-loading rollout into planned project-079 and activation handoff

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-078-normative-loading-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

把 formalized normative-loading direction 拆解为可直接激活的 planned follow-up stream `project-079-normative-loading-lifecycle-compaction-rollout`，并形成 handoff artifact。

## 2. Depends On

1. `TK-748`

## 3. 预期产物

1. `project-079` project / sprint / task package
2. `DA-749` handoff artifact
3. `current-context.md` planned follow-up stream entry

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/adrs/root-bootstrap-truth-and-archive-sidecar-boundary.md`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-718-transport-selection-authority-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 将 formal docs 中的 archive split、deprecated compact 与 parser/gate compatibility follow-up 收敛为 `project-079` 的 sprint / task package。
2. 明确 immediate activation recommendation，避免 implementation 顺序漂移到 active sharding 或 sqlite projection。
3. 形成 canonical handoff artifact，并把 planned stream 回写到 `current-context.md` 与 delivery registry。

## 7. Development Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir .repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks --task-id TK-749 --execution-id exec-20260411-749-decomposition --result "已完成 project-079 planned rollout skeleton、DA-749 handoff 与 current-context planned stream registration" --verify "node ./scripts/governance/check-task-ledger-sync.js; node ./scripts/governance/check-sprint-plan-status-sync.js" --review-delta "project-079 planned follow-up ownership registered" --checklist-note "2026-04-11：已形成 DA-749 handoff artifact，并将 project-079 / sprint-001 登记到 current-context 的 planned follow-up streams。"`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `completed`。
2. 2026-04-11：已完成 `project-079` 三个 planned sprint 与十个 task card 拆解。
3. 2026-04-11：已形成 `DA-749` handoff artifact，并将 `project-079 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
