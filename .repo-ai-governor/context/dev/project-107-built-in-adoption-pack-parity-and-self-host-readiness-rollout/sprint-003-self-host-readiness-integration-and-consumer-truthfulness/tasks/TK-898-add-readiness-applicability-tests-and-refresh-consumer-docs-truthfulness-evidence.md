# TK-898 add readiness applicability tests and refresh consumer docs truthfulness evidence

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-003-self-host-readiness-integration-and-consumer-truthfulness`

## 1. 任务目标

补齐 readiness applicability coverage，并把 consumer docs truthfulness 刷到与实际 runtime / standards 行为一致的状态。

## 2. Depends On

1. `TK-897`
2. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 3. 预期产物

1. readiness applicability tests across `packages/standards` and `apps/cli`
2. consumer docs truthfulness refresh updates
3. project-final evidence bundle for closeout

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-003-self-host-readiness-integration-and-consumer-truthfulness/tasks/TK-897-integrate-self-host-readiness-signals-into-diagnostics-verify-and-execution-preflight.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md`
3. `README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout-completion-audit-summary.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`

## 6. 实施计划

1. 为 self-host-only applicability、placeholder detection 与 adopter path exclusion 补齐最小 tests matrix。
2. 对齐 `README`、`local-adoption-playbook` 与 `support-matrix` 的 truthfulness wording，明确 placeholder / self-host boundary。
3. 收敛 docs evidence 与 tests evidence，供 `TK-899` project-final closeout 使用。
4. 保持 consumer docs 的 uplift 与实际 runtime capability 同步，不抢跑 future scope。

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

1. 待执行：readiness applicability tests matrix
2. 待执行：consumer docs truthfulness refresh updates
3. 待执行：project-final evidence bundle
