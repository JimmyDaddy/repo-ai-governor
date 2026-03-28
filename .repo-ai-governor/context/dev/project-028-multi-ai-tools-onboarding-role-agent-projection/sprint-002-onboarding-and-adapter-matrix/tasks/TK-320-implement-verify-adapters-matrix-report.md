# TK-320 implement verify adapters matrix report

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-002-onboarding-and-adapter-matrix`

## 1. 任务目标

实现 `verify --adapters` 的统一矩阵报告，使工具可用性、角色绑定与降级状态可验证。

## 2. Depends On

1. `TK-318`
2. `TK-319`

## 3. 预期产物

1. `verify --adapters` 矩阵报告
2. 可回链 `execution_id` 的输出契约

## 4. 实施计划

1. 统一输出 `tool / surface / roleProfileId / availability / capabilitySupport / routeCoverage / nextAction`。
2. 固定阈值为 `pass / warn / fail` 三档。
3. 让单工具不可用但有 fallback 的情况可继续闭环，全部不可用时明确阻断。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
