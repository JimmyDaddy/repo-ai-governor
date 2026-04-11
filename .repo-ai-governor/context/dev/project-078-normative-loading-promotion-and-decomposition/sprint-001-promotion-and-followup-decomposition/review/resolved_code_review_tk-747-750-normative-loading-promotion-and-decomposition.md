# Code Review: TK-747 ~ TK-750 normative-loading promotion and decomposition

- Status: resolved
- Date: 2026-04-11
- Reviewer: AI-Agent
- Task: `TK-747`、`TK-748`、`TK-749`、`TK-750`
- Review Type: technical solution promotion review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. Review Scope

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/adrs/root-bootstrap-truth-and-archive-sidecar-boundary.md`
4. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
6. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/**`
7. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/**`
8. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要阻断本次 promotion 与 decomposition cutover 的点。

## 3. Notes

1. 当前 formal landing 采用新模块 `governance.normative-loading`，避免把 root manifest lifecycle 治理继续悬挂到现有治理模块边缘。
2. 本轮 promotion 明确只 formalize `archive split + deprecated compact + root bootstrap truth preservation`，不宣称 active sharding 或 sqlite projection 已进入实施窗口。
3. `project-079` 已作为 planned follow-up stream 落地；后续必须先执行 `sprint-001-archive-split-and-bootstrap-truth-preservation`，再进入 compact automation 与 parser/gate closeout。

## 4. Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. 未修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下可执行代码；本轮为 docs-only promotion / decomposition，因此 `pnpm -s tsc -p tsconfig.json --noEmit` not required。
