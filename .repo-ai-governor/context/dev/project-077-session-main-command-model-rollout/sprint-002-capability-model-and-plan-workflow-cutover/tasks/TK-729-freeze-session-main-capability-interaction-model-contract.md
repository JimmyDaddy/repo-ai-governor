# TK-729 freeze session.main capability interaction model contract

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-002-capability-model-and-plan-workflow-cutover`

## 1. 任务目标

把 `session.main` capability interaction model 从 formal docs 固化到 runtime/CLI 真正消费的 descriptor contract 中，冻结 `raw_role_entry / ai_fixed_workflow / deterministic_utility / pending_existence_review / explain_only`。

## 2. Depends On

1. `TK-743`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`

## 3. 预期产物

1. capability descriptor interaction-model metadata
2. catalog truth for `plan / review / review_verify / run / connect / doctor / workflow / branch_switch`
3. contract-aligned unit coverage

## 4. Required Inputs

1. `packages/core-orchestration-service/src/constants/session-main-capability.constant.ts`
2. `packages/core-orchestration-service/src/types/interfaces/session-main-capability-catalog.interface.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-001-solution-review-promotion-and-rollout-decomposition/tasks/DA-719-session-main-command-model-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-prompt-first-command-model-and-deterministic-workflow-split.md`

## 6. 实施计划

1. 扩展 capability descriptor 类型与常量，使 interaction model 成为 runtime-owned canonical truth。
2. 去掉 public `VERIFY` capability，并把 `run` 标记为 `pending_existence_review`。
3. 为 catalog/discoverability 相关单测补齐 metadata coverage。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest packages/core-orchestration-service --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `in_progress`。
2. 2026-04-10：在 `packages/core-orchestration-service` 的 capability constants / alias types / descriptor interfaces / catalog producer 中补齐 `interactionModel`、`primaryEntry`、`backingExecution` 及 related metadata，并把 public `VERIFY` 从 governed capability catalog 移除。
3. 2026-04-10：补齐 catalog unit coverage，确认 `PLAN`、`REVIEW`、`REVIEW_VERIFY`、`RUN` 等 capability metadata 与 formal contract 对齐。

## 10. 产出

1. 已完成：capability descriptor interaction-model metadata
2. 已完成：contract-aligned catalog coverage
