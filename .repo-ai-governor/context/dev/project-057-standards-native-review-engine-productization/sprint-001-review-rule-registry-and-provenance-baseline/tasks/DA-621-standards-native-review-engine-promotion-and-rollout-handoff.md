# DA-621 standards-native review engine promotion and rollout handoff

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Task: `TK-621`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. Summary

1. `.repo-ai-governor/draft/standards-native-code-review-engine-follow-up-technical-solution.md` 已正式提升为 active technical solution `technical-solution.standards-native-code-review-engine-follow-up`。
2. formal docs 现通过 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md` 明确接受 standards-native review engine、hybrid deterministic + delegated review pipeline 与 provenance-aware governed CR 方向。
3. lifecycle registry、delivery registry、module registry、normative loading manifest 与相关 module overviews 已在同一变更集中对齐。
4. 该方案采用 `followup_required` handoff：本轮 formalize review-rule registry、finding provenance 与 reviewer handoff 的正式方向，并由 `project-057` 承接后续实现。

## 2. Outputs

1. 更新后的 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. 更新后的 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. 更新后的 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
5. 新的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
6. 更新后的 runtime module overviews（`runtime.orchestration`、`runtime.durable-storage`、`runtime.agent-projection`、`runtime.cli-interactive-shell`）
7. `project-057` planned stream skeleton 与 promotion review evidence

## 3. Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. docs-only promotion；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required
