# TK-785 promote local-user-config solution into formal module docs and registries

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-088-local-user-config-and-secret-command-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

将 approved local-user-config draft 正式提升为 `runtime.agent-projection + runtime.governance-clients` formal docs，并同步 lifecycle / delivery / module registry / manifest。

## 2. Depends On

1. `TK-784`
2. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`

## 3. 预期产物

1. 更新后的 formal module docs
2. 更新后的 lifecycle / delivery / module registry / manifest
3. promotion review artifact

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/project-087-local-user-config-and-secret-command-solution-review-completion-audit-summary.md`
2. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`

## 6. 实施计划

1. 将 draft 的 approved decisions 映射到 `module-overview`、两份 contract 与一份 producer ADR，再补 `runtime.governance-clients` consumer contract。
2. 把 lifecycle entry 从 `approved` 推进到 `active` 并写入 `final_paths`。
3. 为该 solution 建立 `followup_required` delivery ownership，并把 planned rollout handoff 指向 `project-089`。

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

1. 2026-04-11：任务创建，状态初始化为 `completed`。
2. 2026-04-11：完成 `runtime.agent-projection` overview / contracts / ADR 与 `runtime.governance-clients` overview / contract 的 formal convergence，写入 user-config defaults、secret-backed credential resolution 与 command-surface boundary。
3. 2026-04-11：lifecycle registry 已将 solution 推进为 `active` 并写入 `final_paths`；delivery registry 已写入 planned rollout ownership。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
4. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
5. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
6. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
7. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
8. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
9. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/review/resolved_code_review_tk-784-787-local-user-config-promotion-and-decomposition.md`
