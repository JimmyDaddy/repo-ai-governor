# TK-661 materialize shared bootstrap assets and host-specific assets through installer

- Status: planned
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-003-complete-pack-content-and-host-materialization`

## 1. 任务目标

通过 installer 统一物化 shared bootstrap assets、repo-visible adoption metadata 与各 host-specific assets，替代 maintainer-first 的离散导出体验。

## 2. Depends On

1. `TK-660`

## 3. 预期产物

1. shared bootstrap materialization
2. host-specific materialization
3. repo-visible adoption metadata layout

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/tasks/TK-660-publish-built-in-adopter-complete-pack-and-capability-coverage-map.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 统一 shared/bootstrap/guide/materialization pipeline。
2. 将 host-specific projection 接入 installer 而不是让用户单独管理 staged export。
3. 保持 installer-managed metadata 与 runtime state 的边界。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：installer-driven materialization baseline
