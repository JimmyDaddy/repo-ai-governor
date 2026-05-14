# TK-1051 promote approved empty repo self-host adoption follow-up solution into formal docs and registries

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-122-empty-repo-self-host-adoption-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

将 approved solution 提升为 active lifecycle-managed solution，并完成 formal module docs、lifecycle、delivery registry、module registry 与 manifest 接线

## 2. Depends On

1. approved review artifact

## 3. 预期产物

1. formal module doc updates for `runtime.governance-clients`
2. lifecycle / delivery / module registry / manifest synchronization
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/draft/empty-repo-self-host-adoption-follow-up-technical-solution.md`
2. `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`
3. `.repo-ai-governor/context/current-context.md`
4. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/plan.md`

## 5. Traceback References

1. `.codex/skills/technical-solution-promotion/SKILL.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. 将 empty-repo self-host follow-up 的 installer contract clarifications 与 adoption/self-host ADR 增量落到正式 module docs。
2. 把 solution lifecycle 从 `approved` 推进到 `active`，并补齐 `final_paths` / delivery entry / module registry / manifest。
3. 跑完 promotion 所需 gates 后回写 task ledger。

## 7. Development Verification

1. docs-only governance window；未修改可执行代码，build not required。
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
3. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
4. `node ./scripts/governance/check-technical-solution-module-graph.js`
5. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
6. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks" --task-id TK-1051`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-13：完成 installer contract、adoption/self-host ADR 与 module overview 的 formal landing，并把 solution 推进为 `active` lifecycle-managed 状态。
3. 2026-05-13：补建独立正式 ADR `adrs/empty-repo-self-host-adoption-follow-up.md`，并将 lifecycle/module registry/manifest 改为指向唯一 `final_paths`，消除旧 solution 文档复用冲突。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
8. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
