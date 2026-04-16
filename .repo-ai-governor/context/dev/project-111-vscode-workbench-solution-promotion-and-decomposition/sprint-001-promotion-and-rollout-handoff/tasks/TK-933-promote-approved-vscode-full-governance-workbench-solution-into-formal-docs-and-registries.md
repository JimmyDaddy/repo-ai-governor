# TK-933 promote approved vscode full governance workbench solution into formal docs and registries

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P0
- Project: `project-111-vscode-workbench-solution-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-rollout-handoff`

## 1. 任务目标

将 approved solution 提升为 active lifecycle-managed solution，并完成 formal module docs、lifecycle、delivery registry、module registry 与 manifest 接线。

## 2. Depends On

1. approved review artifact

## 3. 预期产物

1. formal module doc updates for `runtime.governance-clients / runtime.orchestration`
2. lifecycle / delivery / module registry / manifest synchronization
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md
2. .repo-ai-governor/draft/approved_solution_review_vscode-full-governance-workbench-and-task-driven-orchestration.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/plan.md

## 5. Traceback References

1. .codex/skills/technical-solution-promotion/SKILL.md
2. .repo-ai-governor/context/technical-solution-lifecycle-registry.yaml
3. .repo-ai-governor/context/technical-solution-delivery-registry.yaml
4. .repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/plan.md

## 6. 实施计划

1. 将 VS Code primary workbench surface contract、ADR 与 aggregation facade 落到正式 module docs。
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

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks" --task-id TK-933`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-16：完成 `runtime.governance-clients` 的 VS Code primary workbench surface contract / ADR formal landing，并增量更新 shared overview。
3. 2026-04-16：完成 `runtime.orchestration` 的 governance workbench aggregation facade formal landing，并增量更新 shared overview。
4. 2026-04-16：完成 lifecycle / delivery / module registry / manifest 同步，solution 已推进到 `active`。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`
4. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
6. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
