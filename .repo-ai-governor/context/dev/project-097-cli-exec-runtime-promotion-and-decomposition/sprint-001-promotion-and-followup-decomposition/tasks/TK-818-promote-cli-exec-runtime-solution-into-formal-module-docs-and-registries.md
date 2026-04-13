# TK-818 promote cli-exec runtime solution into formal module docs and registries

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-097-cli-exec-runtime-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

将 approved cli-exec runtime draft 正式提升为 `runtime.agent-projection` formal docs，并同步 lifecycle / delivery / module registry / manifest。

## 2. Depends On

1. `TK-817`
2. `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-096-cli-exec-runtime-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`

## 3. 预期产物

1. 更新后的 formal module docs
2. 更新后的 lifecycle / delivery / module registry / manifest
3. promotion review artifact

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/transport-selection-authority-and-strict-transport-routing.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-096-cli-exec-runtime-solution-review/project-096-cli-exec-runtime-solution-review-completion-audit-summary.md`
2. `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`

## 6. 实施计划

1. 将 draft 的 approved decisions 映射到 `module-overview`、两份 contract 的 additive/optional truth 与一份 producer ADR。
2. 把 lifecycle entry 从 `approved` 推进到 `active` 并写入 `final_paths`。
3. 为该 solution 建立 `followup_required` delivery ownership，并把 planned rollout handoff 指向 `project-098`。

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

1. 2026-04-13：任务创建，状态初始化为 `completed`。
2. 2026-04-13：完成 `runtime.agent-projection` overview / contracts / ADR 的 formal convergence，写入 shared native `cli_exec` runtime、adapter-owned `resolved launch plan`、shared `lifecycle observer` 与 explicit ACP seam guardrail。
3. 2026-04-13：lifecycle registry 已将 solution 推进为 `active` 并写入 `final_paths`；delivery registry 已写入 planned rollout ownership。
