# TK-897 integrate self-host readiness signals into diagnostics verify and execution preflight

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-003-self-host-readiness-integration-and-consumer-truthfulness`

## 1. 任务目标

把 self-host-only readiness interlock 接到 `doctor diagnostics`、`adopt verify` 与 execution preflight，同时保持默认 `adopter-complete` 路径不受误伤。

## 2. Depends On

1. `TK-896`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 3. 预期产物

1. runtime readiness signal routing baseline
2. self-host-only warn / fail_closed policy integration
3. diagnostics / verify / preflight sink ownership note

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
3. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md`
4. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-002-generated-projection-and-placeholder-boundaries/tasks/TK-896-close-sprint-002-standards-parity-coverage-and-sprint-003-handoff-readiness.md`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/tasks/TK-892-formalize-self-host-placeholder-readiness-applicability-and-diagnostics-integration.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-003-self-host-readiness-integration-and-consumer-truthfulness/plan.md`

## 6. 实施计划

1. 将 self-host-only readiness groups 映射到 `doctor diagnostics`、`adopt verify` 与 execution preflight 的稳定结果落点。
2. 只在 self-host path 或等价 detected surface 下启用 readiness interlock，保持 default adopter path fail-closed boundary。
3. 梳理 runtime 中 diagnostics / verify summary / execution preflight 之间的 ownership seam，避免重复 truth surface。
4. 为后续 tests/docs refresh 输出 machine-readable sink note。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：runtime readiness signal routing baseline
2. 待执行：self-host-only policy integration
3. 待执行：sink ownership note
