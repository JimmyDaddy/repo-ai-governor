# TK-656 freeze adoption-pack manifest v1 and installer contract boundary

- Status: completed
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
2. 2026-04-09：激活 `project-061 / sprint-001` 后开始执行，进入 `in_progress`。
3. 2026-04-09：已冻结 adoption-pack manifest/profile/managed-asset-group/source-resolution 的 v1 contract baseline，并将字段边界落实到 `packages/standards` 的 constants / interfaces / registry export surface。

## 10. 产出

1. 已完成：`packages/standards/src/constants/adoption-pack.constant.ts`
2. 已完成：`packages/standards/src/types/interfaces/adoption-pack.interface.ts`
3. 已完成：`packages/standards/src/adoption-pack-registry.ts` 与 `packages/standards/src/index.ts`
