# DA-500 api-key remote adapter invocation technical solution promotion

- Status: active
- Date: 2026-04-02
- Owner: AI-Agent
- Task: `TK-500`
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. Summary

1. `technical-solution.api-key-remote-adapter-invocation` 已从 draft 提升为 `active` formal solution。
2. 方案已正式并入 `runtime.agent-projection`，明确接受 `remote_api` transport、provider binding seam、transport-aware contract delta 与 secret read-only boundary。
3. lifecycle registry、delivery registry、module registry、normative loading manifest、review artifact、task ledger 与 artifact registry 已在同一变更集中对齐。
4. 该方案采用 `followup_required` handoff：formal docs 已激活，但后续 runtime rollout / delivery verification 由 planned `sprint-002` 中的 `TK-501` 承接。

## 2. Outputs

1. 更新后的 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. 更新后的 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. 更新后的 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
5. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
6. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
7. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
8. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
9. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
10. 新的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
11. `resolved_code_review_tk-500-api-key-remote-adapter-invocation-promotion-cutover.md`
12. planned follow-up task `TK-501`

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
