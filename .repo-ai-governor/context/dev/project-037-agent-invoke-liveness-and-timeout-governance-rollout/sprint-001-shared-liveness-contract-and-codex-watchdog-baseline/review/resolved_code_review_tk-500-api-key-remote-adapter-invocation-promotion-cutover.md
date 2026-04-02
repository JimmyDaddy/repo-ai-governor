# Code Review: TK-500 api-key remote adapter invocation promotion cutover

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `TK-500`
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
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
7. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
8. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
9. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
10. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
11. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/plan.md`
12. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-001-shared-liveness-contract-and-codex-watchdog-baseline/**`
13. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/**`
14. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要阻断本次 promotion cutover 的点。

## 3. Notes

1. 本轮 promotion 将 `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md` 正式提升为独立 active solution `technical-solution.api-key-remote-adapter-invocation`，目标模块为 `runtime.agent-projection`。
2. formal docs 现明确接受 `remote_api` transport、`surface -> transport -> provider binding` 组合投影、transport-aware onboarding/probe/projection/liveness contract delta，以及 secret-store / provider-owned config 的 read-only boundary。
3. GitHub 路径的正式结论也已收口：第一阶段不承诺 `github-copilot + remote_api`；若需要 key-based remote inference，应显式新增 `github-models` surface。
4. 本轮 promotion 只 formalize direction 与 delivery handoff，不宣称代码已完成该方向实现；planned `TK-501` 已作为 follow-up rollout owner 建立。
5. 用户已在当前对话中于 `2026-04-02` 明确表示“好”，可作为本轮 promotion 审批前提。

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
10. 未修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下可执行代码；本轮为 docs-only promotion，因此 `pnpm run build` not required。
