# TK-739 add end-to-end regressions for plan review run and verify removal paths

- Status: planned
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-005-regression-migration-cleanup-and-project-closeout`

## 1. 任务目标

补齐 command-model 全链路回归：`/plan` vs `/plan sync`、`/review` vs `/review verify`、deleted `/verify` migration、narrowed `/run` 以及 raw `@planner/@reviewer` bypass。

## 2. Depends On

1. `TK-738`
2. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`

## 3. 预期产物

1. end-to-end regression matrix
2. updated integration/unit coverage
3. clean command-model behavior proof

## 4. Required Inputs

1. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
2. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`

## 5. Traceback References

1. `TK-731`
2. `TK-734`
3. `TK-736`

## 6. 实施计划

1. 为 command model 的关键分支补齐单测与集成测试。
2. 覆盖 deleted `/verify` migration path 与 raw-role bypass。
3. 形成可在 project closeout 中复用的 regression evidence。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：end-to-end regression matrix
2. 待执行：clean command-model behavior proof
