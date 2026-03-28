# sprint-004-ui-report-rollout-and-hardening 计划

- Status: planned
- Date: 2026-03-28
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

把 agent 视图接入 CLI / report / diagnostics，并完成集成测试、smoke 门禁与 adoption 指南。

## 2. Task Package

1. `TK-324` 让 CLI/report 输出 agent 视图。
2. `TK-325` 增加集成测试与 smoke 门禁。
3. `TK-326` 输出使用文档与 adoption 指南。

## 3. Exit Criteria

1. CLI/report 输出具备 agent 级视图和回放信息。
2. onboarding / projection / LangGraph 编排与回退路径均有集成测试和 smoke 覆盖。
3. 外部 adopter 可按最小路径完成接入与验证。

## 4. Execution Notes

1. 该 sprint 只做可用性、可观测性和对外说明，不再引入新的 runtime 语义。
2. 文档输出必须与实际 CLI 行为和报告 schema 保持一致。
