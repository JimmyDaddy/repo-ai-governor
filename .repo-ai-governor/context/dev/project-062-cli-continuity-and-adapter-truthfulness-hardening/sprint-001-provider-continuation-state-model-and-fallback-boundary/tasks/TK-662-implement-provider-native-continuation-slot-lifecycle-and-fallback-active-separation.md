# TK-662 implement provider-native continuation slot lifecycle and fallback-active separation

- Status: planned
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-001-provider-continuation-state-model-and-fallback-boundary`

## 1. 任务目标

实现 provider-native continuation slot lifecycle，并把 fallback-active continuity 与 unsupported/no-fallback 从 runtime 与 presenter 层面清晰分离。

## 2. Depends On

1. `TK-661`
2. 当前 session-shell continuation runtime

## 3. 预期产物

1. continuation slot lifecycle implementation
2. fallback-active separation
3. presenter-safe runtime diagnostics

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-001-provider-continuation-state-model-and-fallback-boundary/plan.md`
2. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-039-provider-session-reuse-and-backend-conversation-continuity-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/project-058-cli-session-continuity-and-claude-recovery-completion-audit-summary.md`

## 6. 实施计划

1. 将 `TK-661` 的状态模型落到 runtime continuation path。
2. 为 fallback-active / unsupported/no-fallback 建立清晰 presenter-safe branching。
3. 产出 regression input，交给 `TK-663` 收口。

## 7. Development Verification

1. targeted CLI continuation regression
2. presenter classification snapshot review

## 8. Delivery Verification

1. provider continuity regression
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：provider-native continuation implementation
2. 待执行：fallback-active separation diagnostics
