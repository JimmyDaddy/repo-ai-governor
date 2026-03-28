# TK-312 expose agent view in CLI and report

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-004-ui-report-rollout-and-hardening`

## 1. 任务目标

让 CLI 与 report 输出 agent 视图，显示 agent 级状态、回放与执行上下文。

## 2. Depends On

1. `TK-309`
2. `TK-311`

## 3. 预期产物

1. CLI/report agent 视图输出
2. agent 级回放信息

## 4. 实施计划

1. 让 `run / review / verify` 的输出都能展示 agent 级状态。
2. 保持 `pretty/plain/json` 的 machine schema 不变。
3. 让 presenter 只消费投影结果，不成为事实源。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
