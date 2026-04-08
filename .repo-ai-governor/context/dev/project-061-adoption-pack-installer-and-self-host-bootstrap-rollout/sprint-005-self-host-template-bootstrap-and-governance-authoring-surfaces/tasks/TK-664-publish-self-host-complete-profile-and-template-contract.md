# TK-664 publish self-host-complete profile and template contract

- Status: planned
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces`

## 1. 任务目标

将 `self-host-complete` 从 concept profile 推进为正式 installer-supported profile，并冻结 template bootstrap contract。

## 2. Depends On

1. `TK-663`

## 3. 预期产物

1. self-host profile definition
2. template contract freeze
3. profile-specific verify expectations

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
3. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 固化 `self-host-complete` profile fields 和 activation policy。
2. 收口 template bootstrap 与 live-state clone 的 fail-closed contract。
3. 为 execution workspace / sqlite / authoring surface bootstrap 提供 profile-level owner boundary。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：self-host-complete profile and template contract
