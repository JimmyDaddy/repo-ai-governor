# DA-519 cli capability maturity analysis promotion cutover

- Status: active
- Date: 2026-04-04
- Owner: AI-Agent
- Task: `TK-519`
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-002-cli-benchmark-and-borrowing-analysis`

## 1. Summary

1. `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md` 已正式提升为 active technical solution `technical-solution.cli-capability-maturity-and-baseline-enhancement-priority`。
2. formal docs 现明确接受 CLI command maturity layering、ROI / strategic priority 双视角，以及 `plan / review / review-verify / upgrade` 这批薄基线命令的 linked-input policy。
3. lifecycle registry、delivery registry、module registry、normative loading manifest、promotion review 与 task ledger 已在同一变更集中对齐。
4. 该方案采用 `docs_only` handoff：本轮只 formalize 优先级 lens 与后续立项联读约束，不宣称相关 command capability 已实现完成。

## 2. Outputs

1. 更新后的 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. 更新后的 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. 更新后的 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
5. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
6. 新的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
7. `resolved_code_review_tk-519-cli-capability-maturity-analysis-promotion-cutover.md`

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
