# TK-862 align codex claude-code github-copilot smoke plus onboarding routing tests to the compatibility taxonomy

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Sprint: `sprint-001-compatibility-taxonomy-and-regression-harness`

## 1. 任务目标

将 `Codex / Claude Code / GitHub Copilot` smoke 与 onboarding/routing 测试对齐到同一 compatibility taxonomy，避免 baseline 只停留在 shared runtime owner 侧。

## 2. Depends On

1. `TK-861`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 3. 预期产物

1. cross-adapter smoke/onboarding/routing alignment plan
2. compatibility evidence mapping across adapter and CLI surfaces
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-001-compatibility-taxonomy-and-regression-harness/tasks/TK-861-establish-native-cli-exec-scenario-class-compatibility-harness-and-preserved-facts-assertions.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`
2. `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`

## 6. 实施计划

1. 将 adapter smoke、onboarding runtime 与 adapter routing surfaces 映射到统一 compatibility taxonomy。
2. 固定 adapter slice 与 runtime foundation 之间的 evidence readback，避免未来 regression 只在单一 surface 留痕。
3. 激活时为 local `CR-001` 提供明确的 cross-adapter review boundary。

## 7. Development Verification

1. 待激活后补充 cross-adapter compatibility verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：cross-adapter compatibility evidence artifacts to be defined in rollout window。
