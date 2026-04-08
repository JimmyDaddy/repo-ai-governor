# TK-660 publish built-in adopter-complete pack and capability coverage map

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-003-complete-pack-content-and-host-materialization`

## 1. 任务目标

发布完整内置 `adopter-complete` pack，并冻结公开 adopter 命令面、guide 入口与 workflow asset coverage map。

## 2. Depends On

1. `TK-659`

## 3. 预期产物

1. built-in complete pack
2. capability coverage map
3. profile definitions

## 4. Required Inputs

1. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
3. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-002-adopt-apply-and-managed-metadata/tasks/TK-659-write-managed-ownership-install-receipt-and-adoption-metadata-baseline.md`

## 5. Traceback References

1. `README.md`
2. `docs/local-adoption-playbook.md`
3. `docs/support-matrix.md`

## 6. 实施计划

1. 将完整 adopter-facing capability map 绑定到 complete pack。
2. 固化 profile 与 guide entrypoints。
3. 为后续 host materialization 和 docs refresh 提供单一 coverage truth。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已发布内置 `adopter-complete` pack definition，补齐 workflow/guide/bootstrap/capability coverage，并将其作为 adopter-facing 的默认整仓安装 baseline。

## 10. 产出

1. 已完成：`packages/standards/src/built-in-adoption-pack-catalog.ts`
2. 已完成：`packages/standards/src/index.ts`
3. 已完成：`apps/cli/test/adopt-command.integration.test.ts`
