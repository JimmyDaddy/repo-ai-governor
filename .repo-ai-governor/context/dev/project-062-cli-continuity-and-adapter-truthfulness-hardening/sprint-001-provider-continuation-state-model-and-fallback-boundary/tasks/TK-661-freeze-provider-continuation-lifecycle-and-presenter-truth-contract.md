# TK-661 freeze provider continuation lifecycle and presenter truth contract

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-001-provider-continuation-state-model-and-fallback-boundary`

## 1. 任务目标

冻结 provider continuation lifecycle、presenter truth contract 与 fallback boundary，为后续 runtime hardening 提供唯一判断口径。

## 2. Depends On

1. `DA-696`
2. `project-058 / project-059` continuity traceback

## 3. 预期产物

1. continuation lifecycle state model
2. presenter truth contract
3. `TK-662 / TK-663` implementation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
2. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-039-provider-session-reuse-and-backend-conversation-continuity-rollout/plan.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`

## 6. 实施计划

1. 收敛 provider continuation 的 state names、entry/exit conditions 与 presenter wording。
2. 明确 provider-native reuse 与 fallback-active continuity 的边界。
3. 产出 implementation-facing acceptance checklist。

## 7. Development Verification

1. targeted provider continuation regression design review
2. session-shell presenter wording consistency check

## 8. Delivery Verification

1. targeted continuity regression
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已把 `previewSummary / latestNoteSummary` 纳入 `SessionMainSupervisorTurnContext` 与 service runtime 投影，明确 lightweight session-note continuity 属于 presenter-safe fallback truth，而不是 provider-native backend reuse。
3. 2026-04-08：已冻结 `SessionProviderContinuationSummary.lightweightSessionFallbackApplied` contract，并同步 `session-shell` i18n wording，明确 `unsupported + lightweight fallback active` 与 `unsupported + no lightweight fallback` 的对外表达差异。
4. 2026-04-08：已完成本轮 contract freeze 需要的 targeted regression 与 same-window `pnpm run build`，任务切换为 `completed`。

## 10. 产出

1. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
2. `packages/core-orchestration-service/src/types/interfaces/provider-continuation.interface.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`
5. `packages/shared/src/i18n/locales/zh-cn.ts`
