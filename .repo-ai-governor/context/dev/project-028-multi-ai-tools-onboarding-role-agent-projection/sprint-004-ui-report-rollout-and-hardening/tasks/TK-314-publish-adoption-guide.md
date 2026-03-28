# TK-314 publish adoption guide

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-004-ui-report-rollout-and-hardening`

## 1. 任务目标

输出外部 adopter 可直接执行的接入说明和 adoption 指南。

## 2. Depends On

1. `TK-312`
2. `TK-313`

## 3. 预期产物

1. adoption 指南
2. 最小接入路径说明

## 4. 实施计划

1. 说明 `npm install -> init -> connect -> doctor -> verify -> run` 的最小路径。
2. 明确前置依赖与受限网络边界。
3. 让文档与实现产物保持可回链一致。

## 5. 验证

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
