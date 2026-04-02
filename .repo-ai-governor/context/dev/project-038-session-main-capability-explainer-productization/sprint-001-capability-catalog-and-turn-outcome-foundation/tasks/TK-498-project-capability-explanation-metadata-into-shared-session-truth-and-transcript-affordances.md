# TK-498 project capability explanation metadata into shared session truth and transcript affordances

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-001-capability-catalog-and-turn-outcome-foundation`

## 1. 任务目标

把 capability explanation metadata 正式投影到 shared session truth、`TURN_COMPLETED` payload 与 CLI transcript affordance，确保 capability answer 不再只是 presenter-local 临时字段。

## 2. Depends On

1. `TK-497`
2. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 3. 预期产物

1. `SessionMainSupervisorTurnOutcome` 与 shared session payload 的 capability metadata 字段
2. `capabilityAnswerKind / referencedCapabilityIds / suggestedActions` 的正式 consumer contract
3. transcript / future desktop consumer 的 follow-up affordance baseline

## 4. 实施计划

1. 将 explanation metadata 写入 shared session truth，而不是只在 CLI presenter 内临时组装。
2. 允许 transcript consumer 渲染 `suggestedActions`，但禁止自动执行。
3. 保持 answer-only turn 与 `direct_execute` / `command_handoff_preview` 的正式 outcome 边界清晰。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test apps/cli/test --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；等待 `TK-497` 完成后执行。
