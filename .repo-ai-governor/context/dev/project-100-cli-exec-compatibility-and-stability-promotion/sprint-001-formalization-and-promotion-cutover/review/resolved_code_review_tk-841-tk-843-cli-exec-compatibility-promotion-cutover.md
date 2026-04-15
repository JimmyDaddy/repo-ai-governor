# Code Review: TK-841 ~ TK-843 cli-exec compatibility promotion cutover

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `TK-841`、`TK-842`、`TK-843`
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
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
8. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
9. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/**`
10. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要阻断本次 promotion cutover 的点。

## 3. Notes

1. 当前 solution 已在 `project-099` 获得 approved review，因此本轮可直接进入 `promote-approved-solution`。
2. 本轮 formalize 的是 native `cli_exec` compatibility/stability runtime guidance，而不是 `governance.execution-gates` 的正式 gate truth。
3. additive launch diagnostics、`terminate_phase` 与 partial snapshot preservation 边界在本轮保持不变，没有被升级为新的 minimum contract 字段。
4. ACP host-facing/public support 仍保留为独立 solution track，本轮没有把 ACP path 伪装成 `cli_exec` canonical truth。

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
