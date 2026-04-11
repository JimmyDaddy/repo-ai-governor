# TK-786 decompose local-user-config rollout into planned project-089 and activation handoff

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-088-local-user-config-and-secret-command-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

把 formalized local-user-config direction 拆解为可直接激活的 planned follow-up stream `project-089-local-user-config-and-secret-command-rollout`，并形成 handoff artifact。

## 2. Depends On

1. `TK-785`

## 3. 预期产物

1. `project-089` project / sprint / task package
2. `DA-786` handoff artifact
3. `current-context.md` planned follow-up stream entry

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-718-transport-selection-authority-promotion-and-rollout-decomposition-handoff.md`

## 6. 实施计划

1. 将 formal docs 中的 follow-up 收敛为 `project-089` 的 sprint / task package。
2. 明确 immediate activation recommendation，避免 implementation 顺序漂移到 docs wording uplift 或 cross-platform polish 之前。
3. 形成 canonical handoff artifact，并把 planned stream 回写到 `current-context.md` 与 delivery registry。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `completed`。
2. 2026-04-11：已完成 `project-089` 三个 planned sprint 与十二个 task card 拆解。
3. 2026-04-11：已形成 `DA-786` handoff artifact，并将 `project-089 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/plan.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/current-context.md`
