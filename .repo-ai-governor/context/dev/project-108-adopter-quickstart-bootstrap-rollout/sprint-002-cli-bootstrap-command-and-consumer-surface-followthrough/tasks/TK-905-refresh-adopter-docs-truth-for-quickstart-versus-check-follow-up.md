# TK-905 refresh adopter docs truth for quickstart versus check follow-up

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough`

## 1. 任务目标

刷新 adopter-facing docs，使 `adopt bootstrap` 的 quickstart path 与 `check` follow-up 的关系保持真实且不误导。

## 2. Depends On

1. `TK-904`

## 3. 预期产物

1. README truth refresh
2. local adoption playbook refresh
3. support matrix wording update

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `README.md`
3. `docs/local-adoption-playbook.md`
4. `docs/support-matrix.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
2. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
3. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`

## 6. 实施计划

1. 刷新 README quickstart wording。
2. 刷新 playbook 中 quickstart 与 `check` follow-up 的解释。
3. 对 support matrix 明确它仍是 existing install mode 之上的 convenience surface。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：README truth refresh
2. 待执行：local adoption playbook refresh
3. 待执行：support matrix wording update
