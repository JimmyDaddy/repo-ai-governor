# TK-892 formalize self-host placeholder readiness applicability and diagnostics integration

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`
- Sprint: `sprint-001-parity-catalog-and-readiness-foundation`

## 1. 任务目标

明确 self-host placeholder readiness 的适用域、结果落点与 diagnostics or verify integration boundary，避免外溢到默认 adopter path。

## 2. Depends On

1. `TK-891`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 3. 预期产物

1. 按 governance / product / execution placeholder group 划分的 readiness applicability matrix
2. `doctor diagnostics` / `adopt verify` / execution preflight 等稳定输出面的 sink mapping
3. self-host-only interlock boundary note 与首批 check/result state proposal

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
3. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
4. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/approved_solution_review_built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
2. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-001-parity-catalog-and-readiness-foundation/plan.md`

## 6. 实施计划

1. 将 adopter-owned placeholder surface 归并成 governance / product / execution readiness group，并明确 self-host enable conditions。
2. 规划 `doctor diagnostics`、`adopt verify`、execution preflight 与其他候选输出面的稳定结果落点。
3. 固化 default `adopter-complete` 不进入 self-host interlock 的 fail-closed boundary，并标注 `warn` / `fail_closed` 分界。
4. 写出面向 `apps/cli` runtime integration 的 first-wave touchpoint list 和 deferred items。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。
2. 2026-04-15：依托 built-in source catalog 开始收敛 `governance_rules_ready / product_direction_ready / execution_surface_ready` 的 self-host-only applicability 与 sink mapping。
3. 2026-04-15：已在 `ResolvedAdoptionPackDefinition.readinessMatrixRecords` formalize self-host-only readiness applicability，并通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 验证默认 adopter path 不受误伤。

## 10. 产出

1. 已完成：`governance_rules_ready / product_direction_ready / execution_surface_ready` 三组 readiness applicability matrix，统一收敛到 `ResolvedAdoptionPackDefinition.readinessMatrixRecords`。
2. 已完成：`doctor_diagnostics / adopt_verify / execution_preflight` sink mapping 与 self-host repo-local applicability scope 已进入 machine-readable metadata。
3. 已完成：self-host-only boundary 与 runtime follow-up touchpoint 已压缩到 `apps/cli/src/runtime/adoption-pack-runtime.ts`、`agent-onboarding-runtime.ts`、`adapter-verification-runtime.ts` 的 sprint-003 handoff note。
