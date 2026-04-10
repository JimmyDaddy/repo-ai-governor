# TK-736 cut generic implementation asks away from default `/run` handoff

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-004-run-scope-resolution-and-routing-cutover`

## 1. 任务目标

让 generic implementation asks 优先进入 direct answer、planner workflow 或 review/workflow guidance，而不是默认桥接 `/run`。

## 2. Depends On

1. `TK-735`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
3. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 3. 预期产物

1. updated generic implementation routing
2. reduced accidental `/run` hijack
3. routing regression coverage

## 4. Required Inputs

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`

## 5. Traceback References

1. `TK-735`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`

## 6. 实施计划

1. 调整 generic implementation ask 的 intent routing 优先级。
2. 让 planner workflow、workflow guidance 或 direct answer 成为优先路径。
3. 为 `/run` 抢占回退与新优先级补齐测试。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest packages/core-orchestration-service apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：将 generic implementation asks 从 `/run` 默认抢占中移除，不再让 `implement/实现/帮我做` 一类开放式请求直接桥接到 governed run flow。
3. 2026-04-10：为 `run` 增加更明确的 reusable workflow / task-driven execution intent 识别，同时保留显式 “run the next governed workflow” 这类请求继续落到 `/run`。
4. 2026-04-10：补齐 skill-registry 与 dispatcher regressions，确认 generic implementation asks 会回落到 direct answer / planner-style follow-up，而不是被 `/run` 抢占。

## 10. 产出

1. 已完成：updated generic implementation routing
2. 已完成：routing regression coverage
