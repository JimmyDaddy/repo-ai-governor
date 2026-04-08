# TK-659 write managed ownership install receipt and adoption metadata baseline

- Status: planned
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-002-adopt-apply-and-managed-metadata`

## 1. 任务目标

补齐 install receipt、managed ownership 与 adoption metadata persistence，使 installer lifecycle 具备 upgrade/remove 所需的 durable truth。

## 2. Depends On

1. `TK-658`

## 3. 预期产物

1. install receipt writer
2. managed ownership registry
3. adoption metadata layout

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-002-adopt-apply-and-managed-metadata/tasks/TK-658-implement-adopt-apply-installer-and-materialization-pipeline.md`
3. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/TK-653-promote-adoption-pack-installer-follow-up-into-formal-module-docs-and-registries.md`

## 6. 实施计划

1. 写入 installation_id、managed file records 与 verification summary。
2. 约束 remove/upgrade 只自动处理 managed records。
3. 为 adoption verify 与 docs truthfulness 提供 repo-visible receipt truth。

## 7. Development Verification

1. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：managed ownership and install receipt baseline
