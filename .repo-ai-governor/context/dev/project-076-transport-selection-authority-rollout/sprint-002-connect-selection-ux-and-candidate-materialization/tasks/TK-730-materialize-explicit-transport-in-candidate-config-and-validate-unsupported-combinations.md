# TK-730 materialize explicit transport in candidate config and validate unsupported combinations

- Status: planned
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-002-connect-selection-ux-and-candidate-materialization`

## 1. 任务目标

确保 candidate config 始终 materialize user-selected transport，并对 unsupported surface / transport 组合直接 fail-closed。

## 2. Depends On

1. `TK-729`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 3. 预期产物

1. candidate config materialization patch
2. unsupported combination validation
3. authoring diagnostics update

## 4. Required Inputs

1. `packages/config/src/types/interfaces/governor.interface.ts`
2. `packages/config/src/schema-validator.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 5. Traceback References

1. `TK-729`
2. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`

## 6. 实施计划

1. 在 candidate config 中总是显式 materialize transport。
2. 对 `remote_api` 必需字段缺失与 unsupported transport surface 直接 fail。
3. 保留兼容历史 config，但把其归因到 `inferred_from_remote_api`。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm test -- --runInBand`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：candidate materialization patch
2. 待执行：unsupported combination validation patch
