# TK-654 decompose adoption-pack installer rollout into planned project-061 and activation handoff

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-060-adoption-pack-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

把 formalized adoption-pack installer direction 拆解为可直接激活的 planned follow-up stream `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`，并形成 handoff artifact。

## 2. Depends On

1. `TK-653`

## 3. 预期产物

1. `project-061` project / sprint / task package
2. `DA-654` handoff artifact
3. `current-context.md` planned follow-up stream entry

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-049-governance-surface-clients-host-distribution-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-573-governance-surface-clients-host-distribution-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`

## 6. 实施计划

1. 将 draft 中的 Workstream A ~ F 收敛为 planned project-061 的 sprint / task package。
2. 明确 immediate activation recommendation，避免 implementation 顺序漂移。
3. 形成 canonical handoff artifact，并把 planned stream 回写到 `current-context.md` 与 delivery registry。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `completed`。
2. 2026-04-09：已完成 `project-061` 六个 planned sprint 与十二个 task card 拆解。
3. 2026-04-09：已形成 `DA-654` handoff artifact，并将 `project-061 / sprint-001` 登记到 `current-context.md` 的 `Planned Follow-Up Streams`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
