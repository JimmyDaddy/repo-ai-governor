# TK-662 implement adopt diff upgrade remove lifecycle and drift-safe update policy

- Status: planned
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-004-diff-upgrade-remove-and-adoption-verify`

## 1. 任务目标

实现 `adopt diff/upgrade/remove` lifecycle，并让 update/remove 只对 managed ownership truth 自动生效。

## 2. Depends On

1. `TK-661`

## 3. 预期产物

1. diff lifecycle
2. upgrade lifecycle
3. remove lifecycle

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-002-adopt-apply-and-managed-metadata/tasks/TK-659-write-managed-ownership-install-receipt-and-adoption-metadata-baseline.md`
3. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/tasks/TK-661-materialize-shared-bootstrap-assets-and-host-specific-assets-through-installer.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`

## 6. 实施计划

1. 基于 managed ownership 实现 diff/upgrade/remove。
2. 对 drift 和用户自定义修改保持 fail-closed。
3. 把 rollback-safe update policy 绑定到 install receipt truth。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：installer lifecycle commands and drift policy
