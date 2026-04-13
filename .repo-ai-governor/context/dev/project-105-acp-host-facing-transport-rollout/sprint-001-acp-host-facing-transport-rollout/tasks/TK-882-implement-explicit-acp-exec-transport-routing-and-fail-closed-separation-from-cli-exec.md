# TK-882 implement explicit acp_exec transport routing and fail-closed separation from cli_exec

- Status: planned
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-001-acp-host-facing-transport-rollout`

## 1. 任务目标

实现显式 `acp_exec` transport routing，并保持 ACP 与 `cli_exec` fail-closed 分离，不允许把 ACP 成功/失败重写成 `cli_exec` truth。

## 2. Depends On

1. `TK-860`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. explicit acp_exec routing plan
2. fail-closed separation boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/TK-860-implement-acp-host-facing-transport-rollout-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`

## 6. 实施计划

1. 固定 `acp_exec` 与 `cli_exec` 的 distinct transport routing 边界。
2. 明确 fail-closed 语义，避免同一 surface 内 transport rewrite。
3. 为 `TK-883` companion carrier 提供清晰的 transport-scoped 上下文。

## 7. Development Verification

1. 待激活后补充 transport-routing verification。

## 8. Delivery Verification

1. 待激活后补充 rollout-window delivery verification与治理检查。

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待激活：acp_exec routing artifacts to be defined in rollout window。
