# TK-864 wire focused compatibility verification profiles and trigger-matrix routing without promoting them to governance gates

- Status: in_progress
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-002-verification-profiles-trigger-matrix-and-closeout`

## 1. 任务目标

把 focused compatibility verification profiles 与 trigger matrix 变成真实 rollout-owned execution route，同时保持它们不升级为新的 governance gate truth。

## 2. Depends On

1. `TK-863`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`

## 3. 预期产物

1. focused compatibility profile rollout plan
2. trigger-matrix routing boundary and execution notes
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-001-compatibility-taxonomy-and-regression-harness/tasks/TK-863-sprint-001-exit-acceptance-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`

## 6. 实施计划

1. 将 compatibility profile 与 trigger matrix 映射成真实 implementation-window 的 verification route。
2. 固定 shared runtime / cross-adapter / adapter-slice 三档 profile 的触发边界。
3. 明确这些 profile 只作为 rollout guidance，不写成新的 governance gate minimum truth。

## 7. Development Verification

1. 待激活后补充 profile-routing verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：sprint-001 clean closeout 后，当前任务状态切换为 `in_progress`，当前 sprint 被激活为新的 primary execution surface；下一步先为 sprint-002 分配本地 `CR-001`，再开始 profile routing implementation。

## 10. 产出

1. 待激活：compatibility profile routing artifacts to be defined in rollout window。
