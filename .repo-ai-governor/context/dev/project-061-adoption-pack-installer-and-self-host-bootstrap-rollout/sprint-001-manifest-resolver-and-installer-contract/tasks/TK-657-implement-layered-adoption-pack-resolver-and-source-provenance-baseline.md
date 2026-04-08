# TK-657 implement layered adoption-pack resolver and source provenance baseline

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-001-manifest-resolver-and-installer-contract`

## 1. 任务目标

落地 `built_in / global / repo_local` adoption-pack layered resolver，并补齐 source provenance 与 override precedence baseline。

## 2. Depends On

1. `TK-656`

## 3. 预期产物

1. layered resolver
2. source provenance facts
3. repo-local override precedence baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-654-adoption-pack-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`

## 6. 实施计划

1. 实现 source aggregation 与 resolver precedence。
2. 暴露 builtin/global/repo-local provenance facts。
3. 确保 adopter install 不再依赖 `.codex/skills/**` 作为硬前置条件。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-module-graph.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已实现 `built_in / global / repo_local` layered resolver、source provenance 输出与 precedence 规则，并补齐 registry/unit/integration evidence。

## 10. 产出

1. 已完成：`packages/standards/src/adoption-pack-registry.ts`
2. 已完成：`packages/standards/test/adoption-pack-registry.unit.test.ts`
3. 已完成：`apps/cli/test/adopt-command.integration.test.ts`
