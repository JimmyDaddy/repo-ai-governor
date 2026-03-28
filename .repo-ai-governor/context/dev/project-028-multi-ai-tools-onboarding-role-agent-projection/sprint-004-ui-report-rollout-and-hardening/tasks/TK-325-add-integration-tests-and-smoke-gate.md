# TK-325 add integration tests and smoke gate

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-004-ui-report-rollout-and-hardening`

## 1. 任务目标

为 onboarding、projection、LangGraph 编排和回退路径补充集成测试与 smoke 门禁。

## 2. Depends On

1. `TK-318`
2. `TK-321`
3. `TK-323`

## 3. 预期产物

1. 集成测试
2. smoke 门禁

## 4. 实施计划

1. 覆盖 connect、doctor、verify、projection、supervisor 的关键闭环。
2. 验证 fallback / degraded / interrupt 路径不会破坏治理事实源。
3. 让 smoke gate 能为未来 release/cutover 复用。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-code-review-status-sync.js`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
