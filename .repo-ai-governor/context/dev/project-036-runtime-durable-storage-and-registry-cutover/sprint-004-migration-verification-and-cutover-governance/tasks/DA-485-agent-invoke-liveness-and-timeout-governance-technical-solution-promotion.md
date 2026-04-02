# DA-485 agent invoke liveness and timeout governance technical solution promotion

- Status: active
- Date: 2026-04-02
- Owner: AI-Agent
- Task: `TK-485`
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. Summary

1. `technical-solution.agent-invoke-liveness-and-timeout-governance` 已从 draft 提升为 `active` formal solution。
2. 方案已正式并入 `runtime.agent-projection`，新增 invoke liveness contract 与 timeout/liveness governance ADR。
3. lifecycle registry、delivery registry、module registry 与 manifest 已在同一变更集中对齐。
4. 该方案采用 `followup_required` handoff：formal docs 已激活，但后续 runtime rollout 仍待在当前 closeout surface 或后续显式 stream 中继续分解实现。

## 2. Outputs

1. 更新后的 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. 更新后的 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. 更新后的 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
5. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
6. 新的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
7. 新的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
8. `resolved_code_review_tk-485-agent-invoke-liveness-and-timeout-governance-promotion.md`

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
