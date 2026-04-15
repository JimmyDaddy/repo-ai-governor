# TK-907 collect rollout evidence and verify installer quickstart truthfulness

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-003-cleanroom-evidence-and-rollout-closeout`

## 1. 任务目标

收集 rollout evidence，验证 `adopt bootstrap` 没有误报 broader governance audit 完成，也没有越界成新的 install lifecycle owner。

## 2. Depends On

1. `TK-905`
2. `TK-906`

## 3. 预期产物

1. quickstart rollout evidence packet
2. truthfulness verification notes
3. support surface verification summary

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `README.md`
3. `docs/local-adoption-playbook.md`
4. `docs/support-matrix.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-003-cleanroom-evidence-and-rollout-closeout/plan.md`
2. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`

## 6. 实施计划

1. 收集 command/runtime/docs 共同成立的证据。
2. 验证 quickstart wording 没有吞并 `check` follow-up。
3. 形成 support surface truthfulness summary。

## 7. Development Verification

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：quickstart rollout evidence packet
2. 待执行：truthfulness verification notes
3. 待执行：support surface verification summary
