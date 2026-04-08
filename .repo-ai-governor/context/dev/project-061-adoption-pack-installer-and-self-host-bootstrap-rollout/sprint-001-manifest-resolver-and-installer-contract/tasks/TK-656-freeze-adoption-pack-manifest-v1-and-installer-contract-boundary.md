# TK-656 freeze adoption-pack manifest v1 and installer contract boundary

- Status: planned
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-001-manifest-resolver-and-installer-contract`

## 1. 任务目标

冻结 adoption-pack manifest v1、profile model、managed asset groups 与 installer contract 的最小字段和 fail-closed boundary。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 3. 预期产物

1. manifest schema freeze
2. profile model freeze
3. installer contract field map

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`

## 6. 实施计划

1. 固化 manifest / receipt / profile / managed ownership 的字段边界。
2. 收敛 `adopter-complete` 与 `self-host-complete` 的 policy difference。
3. 为后续 resolver / installer / verify 提供稳定契约输入。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：manifest / installer contract freeze evidence
