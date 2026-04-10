# TK-724 promote transport-selection-authority solution into formal module docs and registries

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-075-transport-selection-authority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

将 approved draft 正式提升为 `runtime.agent-projection` formal docs，并同步 lifecycle / delivery registry。

## 2. Depends On

1. `TK-723`
2. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`

## 3. 预期产物

1. 更新后的 `runtime.agent-projection` formal docs
2. 更新后的 lifecycle / delivery registry
3. promotion review artifact

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/project-074-transport-selection-authority-solution-review-completion-audit-summary.md`
2. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`

## 6. 实施计划

1. 将 draft 的 approved decisions 映射到 `module-overview`、三份 contract 与 remote-api ADR。
2. 把 lifecycle entry 从 `approved` 推进到 `active` 并写入 `final_paths`。
3. 为该 solution 建立 `followup_required` delivery ownership，并把 planned rollout handoff 指向 `project-076`。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：完成 `runtime.agent-projection` overview / contracts / ADR 的 formal convergence，写入 transport selection authority、strict transport routing 与 evidence-gated public wording boundary。
3. 2026-04-09：lifecycle registry 已将 solution 推进为 `active` 并写入 `final_paths`；delivery registry 已写入 planned rollout ownership。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
6. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
7. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
8. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/review/resolved_code_review_tk-723-725-transport-selection-authority-promotion-and-decomposition.md`
