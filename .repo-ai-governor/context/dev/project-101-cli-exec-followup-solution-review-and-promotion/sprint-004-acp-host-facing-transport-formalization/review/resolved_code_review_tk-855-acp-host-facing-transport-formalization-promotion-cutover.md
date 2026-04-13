# Code Review: TK-855 acp host-facing transport formalization promotion cutover

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `TK-855`
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

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
8. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
9. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/**`
10. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要阻断本次 promotion cutover 的点。

## 3. Notes

1. 本轮 formalize 的是 `acp_exec` distinct transport truth、`acp_host_companion` additive carrier 与 rollout-gated distribution boundary，不是 ACP runtime cutover 或 public support wording 完成态。
2. lifecycle `final_paths` 仅占有 solution-owned ADR；overview 与两份 contract 继续作为 shared formal docs 复用。
3. delivery handoff 已指向新的 `project-105` planned rollout skeleton，符合 `followup_required + adopter_cli + packaged_distribution + runtime_service + planned rollout` 的治理边界。

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
10. `node ./scripts/governance/check-worktree-review-target.js`
11. 未修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下可执行代码；本轮为 docs-only promotion，因此 `pnpm -s tsc -p tsconfig.json --noEmit` 与 `pnpm run build` not required。
