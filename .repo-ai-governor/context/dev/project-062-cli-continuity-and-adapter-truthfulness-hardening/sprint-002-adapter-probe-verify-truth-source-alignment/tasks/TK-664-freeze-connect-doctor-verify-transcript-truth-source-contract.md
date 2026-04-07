# TK-664 freeze connect doctor verify transcript truth-source contract

- Status: planned
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-002-adapter-probe-verify-truth-source-alignment`

## 1. 任务目标

冻结 `connect / doctor / verify / transcript` 之间的 adapter readiness truth-source contract，避免同一适配器在不同入口给出矛盾结论。

## 2. Depends On

1. `TK-663`
2. 当前 adapter diagnostics surfaces

## 3. 预期产物

1. truth-source contract
2. outcome taxonomy
3. `TK-665 / TK-666` 实施输入

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-001-provider-continuation-state-model-and-fallback-boundary/tasks/TK-663-close-continuity-hardening-with-session-shell-regression-and-build-evidence.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`

## 6. 实施计划

1. 统一 adapter readiness facts 的 producer/consumer 边界。
2. 明确 probe failure、auth failure、quota failure、transport fallback、continuity fallback 的分类。
3. 输出 presenter-safe wording 约束。

## 7. Development Verification

1. adapter diagnostics contract review
2. cross-surface copy consistency check

## 8. Delivery Verification

1. targeted cross-adapter verification rehearsal
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：truth-source contract
2. 待执行：outcome taxonomy
