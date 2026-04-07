# TK-661 freeze provider continuation lifecycle and presenter truth contract

- Status: planned
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

## 10. 产出

1. 待执行：provider continuation lifecycle contract
2. 待执行：presenter truth acceptance checklist
