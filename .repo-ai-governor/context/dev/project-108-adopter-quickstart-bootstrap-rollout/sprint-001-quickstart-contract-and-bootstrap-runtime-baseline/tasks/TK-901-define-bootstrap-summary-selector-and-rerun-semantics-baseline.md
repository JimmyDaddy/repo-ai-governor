# TK-901 define bootstrap summary selector and rerun semantics baseline

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-001-quickstart-contract-and-bootstrap-runtime-baseline`

## 1. 任务目标

将 bootstrap summary、selector resolution 与 clean rerun or drift redirect semantics 收敛成稳定的 runtime and presenter baseline。

## 2. Depends On

1. `TK-900`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 3. 预期产物

1. bootstrap summary field baseline
2. selector resolution matrix
3. rerun and drift redirect rule set

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
3. `apps/cli/src/runtime/adoption-pack-runtime.ts`
4. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
2. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`

## 6. 实施计划

1. 冻结 selector 缺省 built-in 与 explicit resolver reuse matrix。
2. 冻结 bootstrap summary 的 additive field boundary。
3. 明确 clean rerun、drift redirect 与 mismatch redirect 的 fail-closed semantics。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：bootstrap summary field baseline
2. 待执行：selector resolution matrix
3. 待执行：rerun / drift redirect rule set
