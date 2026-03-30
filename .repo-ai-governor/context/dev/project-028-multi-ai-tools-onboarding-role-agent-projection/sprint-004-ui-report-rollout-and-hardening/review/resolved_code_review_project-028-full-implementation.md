# Code Review: project-028-multi-ai-tools-onboarding-role-agent-projection Full Implementation

- Status: resolved
- Date: 2026-03-30
- Reviewer: AI-Agent
- Scope: `project-028` 全量产出（`sprint-001` + `sprint-002` + `sprint-003` + `sprint-004`）
- Review Type: project-level working-tree code review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`

## 1. Review Scope

1. `connect / doctor / verify / run / review` 的 onboarding、projection、reporting 与 diagnostics 接线。
2. `@repo-ai-governor/core-agent-projection` package、shared-session projection 与 LangGraph supervisor planner。
3. CLI output、report builder、README/playbook 与 delivery closeout evidence。

## 2. Findings

### 2.1 已解决：`connect` 对候选配置先 fail-closed 做 schema 校验，会阻断不完整 local-model 基线的诊断收口

1. 初始实现里，`connect` 在写出候选配置前先执行严格 schema 校验；当源配置包含尚未补齐的 local-model 字段时，命令会直接失败。
2. 这与 onboarding contract 的目标冲突，因为 adopter 此时最需要的是候选配置 artifact、诊断 JSON 和 `nextAction`，而不是提前终止。
3. 当前实现已改为始终写出 candidate config artifact，并把 schema 问题降级为 `candidateConfigValidationError` 附带在 diagnostics 中继续执行 verification。

### 2.2 已解决：共享 session 直接复用执行级 session id，会与 memory promotion 的 session summary key 发生碰撞

1. `run` 接入 agent session projection 时，最初直接把 execution session id 用作 shared-session projection id。
2. 这会污染已有 memory/session summary 路径，导致 execution report 与 session projection 的事实回链出现键冲突风险。
3. 当前实现已将 shared session 投影固定为 `shared-<executionId>` 前缀，避免与既有 session summary 语义相撞。

### 2.3 Remaining Findings

1. 无剩余阻塞或待验证发现。

## 3. Verification

1. `pnpm run build`
2. `pnpm exec vitest run packages/core-agent-projection/test/agent-projection-service.unit.test.ts packages/core-agent-projection/test/agent-session-registry.unit.test.ts packages/core-runtime-langgraph/test/agent-descriptor-supervisor.unit.test.ts packages/reporting/test/report-builder.unit.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-docs-triad-sync.js`
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
8. `node ./scripts/governance/check-technical-solution-module-graph.js`

## 4. Conclusion

1. `project-028-multi-ai-tools-onboarding-role-agent-projection` 已满足 contract、runtime、reporting、adoption docs 与 review lifecycle 要求。
2. 当前已无待接受修复项；本 review 以 `resolved` 状态收口。
