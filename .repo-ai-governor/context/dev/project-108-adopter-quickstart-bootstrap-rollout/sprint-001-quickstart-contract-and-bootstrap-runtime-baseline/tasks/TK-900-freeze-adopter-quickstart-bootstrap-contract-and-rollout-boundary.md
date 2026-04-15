# TK-900 freeze adopter quickstart bootstrap contract and rollout boundary

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-001-quickstart-contract-and-bootstrap-runtime-baseline`

## 1. 任务目标

冻结 `adopt bootstrap` 的 formal quickstart boundary，明确它与 `baseline bootstrap`、`check` follow-up 以及 installer lifecycle 的职责分层。

## 2. Depends On

1. `technical-solution.adopter-quickstart-bootstrap-command`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`

## 3. 预期产物

1. quickstart boundary freeze
2. rollout scope and non-goal matrix
3. `DA-900` promotion and rollout handoff

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
3. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
4. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 6. 实施计划

1. 固化 quickstart 与 baseline bootstrap 的分层口径。
2. 冻结 `check`、selector 与 rerun redirect 的 immediate operating boundary。
3. 产出 rollout handoff，作为后续 sprint 的首跳输入。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：quickstart boundary freeze
2. 待执行：rollout scope / non-goal matrix
3. 待执行：`DA-900`
