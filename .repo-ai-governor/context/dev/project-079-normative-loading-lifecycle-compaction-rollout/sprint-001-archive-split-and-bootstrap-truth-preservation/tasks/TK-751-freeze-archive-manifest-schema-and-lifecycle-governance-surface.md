# TK-751 freeze archive manifest schema and lifecycle governance surface

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-001-archive-split-and-bootstrap-truth-preservation`

## 1. 任务目标

冻结 archive manifest schema、manifest lifecycle governance doc 与 root/archive catalog 的正式职责边界，为后续 archive split 提供稳定 contract。

## 2. Depends On

1. `DA-749`

## 3. 预期产物

1. archive manifest schema baseline
2. lifecycle governance doc v1
3. root/archive catalog responsibility matrix

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/adrs/root-bootstrap-truth-and-archive-sidecar-boundary.md`
3. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`

## 6. 实施计划

1. 将 formal contract 转成 archive manifest schema 与 lifecycle governance doc 的 concrete authoring surface。
2. 明确 root manifest、archive manifest 与 future deferred follow-up 的职责矩阵。
3. 固定 migration 前的 compatibility constraints，避免 sprint-001 内 scope 漂移。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：已新增 `normative-loading-manifest-lifecycle-governance.md`，固定 root/bootstrap truth、archive sidecar schema、same-window mutation 与 rollback 边界。
3. 2026-04-11：已将 archive manifest 作为 active sidecar governance surface 注册到 root manifest，但未引入新的 startup truth 或 active shard indirection。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
2. `.repo-ai-governor/normative_knowledge_sources/archive/normative-loading-manifest.archive.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
