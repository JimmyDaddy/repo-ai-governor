# Code Review: TK-817 ~ TK-820 cli-exec runtime promotion and decomposition

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `TK-817`、`TK-818`、`TK-819`、`TK-820`
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
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/context/dev/project-097-cli-exec-runtime-promotion-and-decomposition/**`
8. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/**`
9. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要阻断本次 promotion 与 decomposition cutover 的点。

## 3. Notes

1. 用户已在当前对话中于 `2026-04-13` 明确继续推进该 approved solution 的 promotion，可作为本轮 formal cutover 前提。
2. 本轮 promotion 采用既有 `runtime.agent-projection` module，而不是新建平行 runtime module。
3. 本轮 formalize 的是 native `cli_exec` runtime / contract truth 与 delivery decomposition，不宣称 shared runtime code、cross-adapter cutover、或 ACP public support wording 已全部交付。
4. `project-098` 已作为 planned follow-up stream 落地；后续必须先执行 `sprint-001-native-cli-runtime-foundation-and-codex-convergence`，再进入 cross-adapter hardening 与 ACP seam guardrail阶段。

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
