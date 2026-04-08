# TK-658 implement adopt apply installer and materialization pipeline

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-002-adopt-apply-and-managed-metadata`

## 1. 任务目标

实现高层 `adopt apply` installer command，使其能将 adoption-pack materialize 到目标仓库，而不是只输出低层 host export 子步骤。

## 2. Depends On

1. `TK-657`

## 3. 预期产物

1. installer command path
2. materialization pipeline
3. repo writer baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-001-manifest-resolver-and-installer-contract/tasks/TK-657-implement-layered-adoption-pack-resolver-and-source-provenance-baseline.md`
3. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 将 resolver 输出接到 installer command。
2. 实现 shared assets、host assets 与 bootstrap metadata 的 materialization。
3. 保持 runtime truth boundary，不静态写入 runtime operational state。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已交付高层 `adopt` command surface 与 installer materialization pipeline，使 adopter 可以直接通过 `adopt apply` 安装整套受管仓库 baseline。

## 10. 产出

1. 已完成：`apps/cli/src/commands/adopt-command.ts`
2. 已完成：`apps/cli/src/constants/cli-adopt.constant.ts`
3. 已完成：`apps/cli/src/main.ts`
