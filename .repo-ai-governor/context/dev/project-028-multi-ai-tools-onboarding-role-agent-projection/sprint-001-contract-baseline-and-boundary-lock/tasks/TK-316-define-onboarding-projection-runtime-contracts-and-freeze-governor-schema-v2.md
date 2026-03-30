# TK-316 define onboarding / projection / runtime contracts and freeze governor schema v2

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-001-contract-baseline-and-boundary-lock`

## 1. 任务目标

将 `multi-ai-tools-onboarding-with-role-agent-projection-technical-solution` 投影为 `runtime.agent-projection` 的 formal module overview、onboarding contract、projection contract 与 ADR 正式骨架。

## 2. Depends On

1. `.repo-ai-governor/draft/multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`
2. `.repo-ai-governor/draft/review_multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`

## 3. 预期产物

1. `runtime.agent-projection/module-overview.md`
2. `runtime.agent-projection/contracts/agent-onboarding-contract.md`
3. `runtime.agent-projection/contracts/agent-projection-contract.md`
4. `runtime.agent-projection/adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`
5. `DA-316`

## 4. 实施计划

1. 从 draft 提取 onboarding / projection / execution 的边界与契约。
2. 写入 module overview、onboarding contract、projection contract 与 ADR 正式文档。
3. 保持 formal docs 描述“结构化投影边界”，而不是直接承诺本轮代码改造已完成。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 `runtime.agent-projection` formal module overview、onboarding contract、projection contract 与 ADR 收口，并通过 `DA-316` 将 project activation / delivery handoff 固定为 completed 真值。
