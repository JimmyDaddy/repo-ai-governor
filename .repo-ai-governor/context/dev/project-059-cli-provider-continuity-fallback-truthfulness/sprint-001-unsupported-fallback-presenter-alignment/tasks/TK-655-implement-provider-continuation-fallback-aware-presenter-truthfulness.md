# TK-655 implement provider continuation fallback-aware presenter truthfulness

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-059-cli-provider-continuity-fallback-truthfulness`
- Sprint: `sprint-001-unsupported-fallback-presenter-alignment`

## 1. 任务目标

修正 provider continuation presenter truthfulness：当 backend continuation `unsupported` 但 shell 已通过 lightweight session summary 保住连续性时，CLI 不应继续把该结果显示成用户视角下的“问题仍存在”。

## 2. Depends On

1. `project-058` continuity fallback / Claude recovery closeout evidence

## 3. 预期产物

1. provider continuation summary fallback truth projection
2. transcript presenter branch for fallback-active unsupported scenarios
3. targeted regression coverage plus same-window build evidence

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
4. `packages/core-orchestration-service/src/types/interfaces/provider-continuation.interface.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
2. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
3. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`

## 6. 实施计划

1. 为 presenter-safe continuation summary 增加 fallback 生效真值。
2. 调整 transcript presenter 与文案，使 unsupported + fallback-active 不再按未修复问题呈现。
3. 补齐 targeted regression，并记录 build/test evidence。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `node ./scripts/governance/sync-task-ledger.js --task-id TK-655`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮直接沿 presenter truth surface 修正 unsupported + fallback-active 的输出。
2. 2026-04-08：已为 presenter-safe `providerContinuationSummary` 增加 `lightweightSessionFallbackApplied` 真值，用于区分 fallback 已生效与未生效的 unsupported 场景。
3. 2026-04-08：已更新 transcript presenter 与 i18n 文案：unsupported + fallback-active 现在按“连续性已通过轻量摘要保住”的信息展示；无 fallback 时继续保留 truthful unsupported 提示。
4. 2026-04-08：`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build` 全部通过，任务完成。

## 10. 产出

1. `packages/core-orchestration-service/src/types/interfaces/provider-continuation.interface.ts`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
5. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
