# project-028-multi-ai-tools-onboarding-role-agent-projection 计划

- Status: planned
- Date: 2026-03-28
- Stage Mapping: Multi-tool onboarding and role-agent projection formalization
- Phase Mapping: Technical Solution Promotion / Runtime Onboarding Projection

## 1. 目标

1. 将 `multi-ai-tools-onboarding-with-role-agent-projection-technical-solution` 正式化为 lifecycle-managed 技术方案。
2. 将 formal landing zone 固定为新的 `runtime.agent-projection` 模块，而不是继续停留在 `.repo-ai-governor/draft/**`。
3. 同步 lifecycle registry、delivery registry、module registry、manifest 与 follow-up project skeleton，确保 promotion 不停留在文档面。
4. 以 follow-up project 形式承接后续 implementation，不在本轮 promotion 中直接扩展代码改造范围。

## 2. Sprint 细化

## 2.1 sprint-001-contract-baseline-and-boundary-lock

- Status: planned
- Sprint Goal: 完成 onboarding / projection / runtime 三层契约、module skeleton、delivery handoff 与 follow-up project skeleton。
- Task Package: `TK-316`、`TK-317`。
- Exit Criteria:
  1. `project-028` skeleton 已建立，`current-context.md` 已登记为 planned follow-up stream。
  2. `runtime.agent-projection` formal docs 已写入 `module-overview / onboarding contract / projection contract / ADR`。
  3. `technical-solution.multi-ai-tools-onboarding-role-agent-projection` 已从 `draft` 切换为 `active`，并同步 lifecycle / delivery / module-registry / manifest。
  4. review、artifact、task ledger 与 sprint plan 保持同步。

## 2.2 sprint-002-onboarding-and-adapter-matrix

- Status: planned
- Sprint Goal: 落实 `connect / doctor / verify` 三段式 onboarding 链路与最小支持矩阵。
- Task Package: `TK-318`、`TK-319`、`TK-320`。
- Exit Criteria:
  1. `connect` 可生成 `single-tool-all-roles` 与 `multi-tool-default` 两类 preset，并输出可校验配置。
  2. `doctor --adapters` 至少覆盖 1 条可自动修复路径与 1 条仅输出 `nextAction` 的路径。
  3. `verify --adapters` 可输出 `pass / warn / fail` 三档判定并回链 `execution_id`。

## 2.3 sprint-003-role-agent-projection-and-langgraph-supervisor

- Status: planned
- Sprint Goal: 落实 `AgentProjectionService`、`AgentSessionRegistry` 与 LangGraph supervisor 的 multi-agent 编排接线。
- Task Package: `TK-321`、`TK-322`、`TK-323`。
- Exit Criteria:
  1. `AgentProjectionService` 能把 role / route / surface 投影为 JSON 可序列化的 `AgentDescriptor`。
  2. `AgentSessionRegistry` 仅作为共享 session 的投影层，不引入新的 canonical session source。
  3. LangGraph supervisor 能消费 agent descriptor 并保持与现有 `AgentRouteRunner` 语义一致。

## 2.4 sprint-004-ui-report-rollout-and-hardening

- Status: planned
- Sprint Goal: 把 agent 视图接入 CLI / report / diagnostics，并完成集成测试、smoke 门禁与 adoption 指南。
- Task Package: `TK-324`、`TK-325`、`TK-326`。
- Exit Criteria:
  1. CLI/report 输出具备 agent 级视图和回放信息。
  2. onboarding / projection / LangGraph 编排与回退路径均有集成测试和 smoke 覆盖。
  3. 外部 adopter 可按最小路径完成接入与验证。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-316 | sprint-001 | 定义 onboarding / projection / runtime 三层契约并冻结 governor.yaml schema v2 | docs/module-baseline | `.repo-ai-governor/draft/multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md` | planned |
| TK-317 | sprint-001 | 冻结 agent descriptor 最小字段集 | docs/contract-baseline | TK-316 | planned |
| TK-318 | sprint-002 | 实现 connect 模板与路由基线生成 | runtime/onboarding | TK-316,TK-317 | planned |
| TK-319 | sprint-002 | 实现 doctor --adapters 探测与 safe_local 修复 | runtime/onboarding | TK-318 | planned |
| TK-320 | sprint-002 | 实现 verify --adapters 矩阵报告 | runtime/onboarding | TK-318,TK-319 | planned |
| TK-321 | sprint-003 | 实现 AgentProjectionService | runtime/projection | TK-316,TK-317 | planned |
| TK-322 | sprint-003 | 实现 AgentSessionRegistry | runtime/projection | TK-321 | planned |
| TK-323 | sprint-003 | 接入 LangGraph supervisor | runtime/orchestration | TK-321,TK-322 | planned |
| TK-324 | sprint-004 | 让 CLI/report 输出 agent 视图 | ui/report | TK-321,TK-323 | planned |
| TK-325 | sprint-004 | 增加集成测试与 smoke 门禁 | quality/gates | TK-318,TK-321,TK-323 | planned |
| TK-326 | sprint-004 | 输出使用文档与 adoption 指南 | docs/adoption | TK-324,TK-325 | planned |

## 4. 依赖产物策略

1. `project-028` 启动默认消费：
   - `.repo-ai-governor/draft/multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`
   - `.repo-ai-governor/draft/review_multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
2. 本项目只 formalize 技术方案与治理真值，不把 draft 中的后续 implementation phases 直接扩成代码改造窗口。
3. 若未来需要把本方案进一步落成真实 command / runtime / presenter 改造，必须以新的 stream 承接。

## 5. DoD（project-028）

1. `technical-solution.multi-ai-tools-onboarding-role-agent-projection` 已从 draft 进入 formal lifecycle-managed source of truth。
2. `runtime.agent-projection` 的 module overview、contracts 与 ADR 已登记到 module registry 与 manifest。
3. delivery ownership、review evidence、task ledger 与 current-context 保持同步。
4. follow-up project 已完成四段式任务拆分，可继续按 sprint 承接 implementation。

## 6. 里程碑记录

1. 2026-03-28：创建 `project-028-multi-ai-tools-onboarding-role-agent-projection`，并登记 `sprint-001-contract-baseline-and-boundary-lock` 为 planned follow-up stream。
2. 2026-03-28：完成 `sprint-001 ~ sprint-004` 四段式任务拆分，覆盖 onboarding、projection、supervisor、UI/report、quality gate 与 adoption。
