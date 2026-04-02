# Code Review: TK-494 session-main capability explainer and contextual guidance promotion cutover

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `TK-494`
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

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/plan.md`
8. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-001-shared-liveness-contract-and-codex-watchdog-baseline/**`
9. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要阻断本次 promotion cutover 的点。

## 3. Notes

1. 本轮 promotion 将 `.repo-ai-governor/draft/session-main-capability-explainer-and-contextual-command-guidance-technical-solution.md` 正式并入现有 active solution `technical-solution.interactive-cli-react-style-cli`，而不是新建并列 solution id。
2. formal docs 现明确接受 service-owned capability explainer、governed capability catalog、locale-neutral seed + localized descriptor view，以及 `capabilityAnswerKind / referencedCapabilityIds / suggestedActions` 的 shared-session 投影。
3. formal docs 同时明确切开了“可解释的 governed bridge capabilities”与 CLI shell-local builtins 的单一事实来源边界；CLI presenter 可以组合展示，但 orchestration 不拥有 builtin canonical truth。
4. 本轮 promotion 只 formalize direction 与 consumer/runtime contract，不宣称代码已完成该方向实现；用户已在当前对话中于 `2026-04-02` 明确表示“好，帮我提升这个技术方案吧”，可作为本轮 promotion 的审批前提。

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
