# TK-735 retain `run` as reusable governed execution flow only

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-004-run-scope-resolution-and-routing-cutover`

## 1. 任务目标

保留 public `run`，但把它的 semantics 收窄到 reusable governed workflow / task-driven execution flow，不再默认代表所有“帮我做/帮我实现”请求。

## 2. Depends On

1. `TK-734`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
3. `apps/cli/src/commands/run-command.ts`

## 3. 预期产物

1. narrowed run capability wording
2. aligned runtime/presenter semantics
3. run scope evidence coverage

## 4. Required Inputs

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
2. `apps/cli/src/runtime/task-driven-run-runtime.ts`
3. `apps/cli/src/commands/run-command.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
2. `TK-734`

## 6. 实施计划

1. 固化 `run` 的 capability metadata、summary/detail 与 presenter wording。
2. 保持 task-driven DAG 主链定位，不删除 public `run`。
3. 为 narrowed wording 与 capability contract 增加测试。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest apps/cli/test/runtime/task-driven-run-runtime.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：`TK-745 / DA-745` 已完成 sprint-003 closeout 与 sprint-004 activation handoff，`TK-735` 状态切换为 `in_progress`，并接管为当前 active implementation boundary。
3. 2026-04-10：收窄 `run` 的 public wording，把 capability summary/detail、CLI command description、README 与 triad docs 对齐到 reusable governed workflow / task-driven execution flow。
4. 2026-04-10：保留 `run` 的 public surface 与 `pending_existence_review` metadata，同时补齐 capability-catalog regression，固定 `confirmationRequired / interactionModel / backingExecution` 的 contract truth。
5. 2026-04-10：完成 `pnpm run build` 与 sprint-004 targeted session-main regressions，确认 run semantics 收窄后没有破坏 shell/discoverability 基线。

## 10. 产出

1. 已完成：narrowed run capability wording
2. 已完成：run scope evidence coverage
