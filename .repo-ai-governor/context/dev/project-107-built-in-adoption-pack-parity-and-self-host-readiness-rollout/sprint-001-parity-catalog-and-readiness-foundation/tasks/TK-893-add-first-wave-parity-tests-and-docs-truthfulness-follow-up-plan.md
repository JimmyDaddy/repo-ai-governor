# TK-893 add first-wave parity tests and docs truthfulness follow-up plan

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-001-parity-catalog-and-readiness-foundation`

## 1. 任务目标

规划 first-wave parity tests、applicability-scope tests 与 docs truthfulness refresh 的 follow-up scope，作为后续 execution 启动入口。

## 2. Depends On

1. `TK-892`
2. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 3. 预期产物

1. `packages/standards` parity tests 与 `apps/cli` applicability-scope tests 的 first-wave matrix
2. 面向 `README / local-adoption-playbook / support-matrix` 的 docs truthfulness refresh matrix
3. `sprint-002 / sprint-003` activation recommendation 与 evidence gating note

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md`
3. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
4. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 5. Traceback References

1. `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`

## 6. 实施计划

1. 将 first-wave automated checks 拆成 `packages/standards` parity tests、`apps/cli` applicability-scope tests 与 docs evidence gates 三类。
2. 明确 docs truthfulness follow-up 只在 source model 与 readiness sink 稳定后推进，并标记各 consumer surface 的 owner。
3. 输出 `sprint-002 / sprint-003` activation recommendation 与 evidence gating note。
4. 保持 consumer docs 不在本 sprint 提前 uplift，只冻结 follow-up strategy。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：parity/applicability test matrix
2. 待执行：docs truthfulness refresh matrix
3. 待执行：`sprint-002 / sprint-003` activation recommendation / evidence gating note
