# TK-725 decompose transport-selection-authority rollout into planned project-076 and activation handoff

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-075-transport-selection-authority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

把 formalized solution 拆解为可直接激活的 planned follow-up stream `project-076-transport-selection-authority-rollout`，并形成 handoff artifact。

## 2. Depends On

1. `TK-724`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 3. 预期产物

1. `project-076` project / sprint / task package
2. `DA-718` handoff artifact
3. planned follow-up stream registration

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/project-074-transport-selection-authority-solution-review-completion-audit-summary.md`

## 6. 实施计划

1. 将 follow-up 拆成 `contract/routing truth`、`connect selection UX` 与 `evidence-gated docs` 三个 sprint。
2. 形成 `DA-718` handoff artifact，并把 `project-076 / sprint-001` 写入 `current-context.md` 的 planned follow-up streams。
3. 补齐 `DA-718` 的 artifact registry 记录与 project-075 closeout evidence。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：完成 `project-076` 三个 sprint 与九个 task card 的 planned decomposition。
3. 2026-04-09：形成 `DA-718` handoff artifact，并将 `project-076 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。
4. 2026-04-09：补齐 `DA-718` 的 canonical artifact registry 记录并重渲染 rendered view。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-001-contract-and-routing-truth-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/plan.md`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/plan.md`
5. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-718-transport-selection-authority-promotion-and-rollout-decomposition-handoff.md`
