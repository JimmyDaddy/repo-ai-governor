# project-028-multi-ai-tools-onboarding-role-agent-projection 计划

- Status: completed
- Date: 2026-03-30
- Stage Mapping: Multi-tool onboarding / role-agent projection rollout
- Phase Mapping: Contract baseline / Onboarding matrix / Projection runtime / UI-report rollout
- Upstream:
  - `.repo-ai-governor/draft/multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`
  - `.repo-ai-governor/draft/review_multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/multi-tool-onboarding-and-role-agent-projection-cutover.md`

## 1. 目标

1. 将 `runtime.agent-projection` 从 formal docs 继续落成真实 CLI/runtime/reporting 实现，而不是停留在 promotion 与 skeleton 层。
2. 让 `connect / doctor / verify` 形成可落地的 multi-tool onboarding 闭环，并输出候选配置、诊断契约、矩阵报告与 `nextAction`。
3. 让 role/route/surface 能被投影为稳定的 `AgentDescriptor`，并接入共享 session 视图与 LangGraph supervisor 规划。
4. 把 agent 级视图接入 CLI / report / diagnostics / adoption 文档，并以测试、build 与 governance gate 收尾到 completed。

## 2. Sprint 细化

## 2.1 sprint-001-contract-baseline-and-boundary-lock

- Status: completed
- Sprint Goal: 固定 `runtime.agent-projection` 的 formal contract、delivery handoff 与 project activation baseline。
- Task Package: `TK-316`、`TK-317`。

## 2.2 sprint-002-onboarding-and-adapter-matrix

- Status: completed
- Sprint Goal: 完成 `connect / doctor / verify` 的 onboarding matrix、safe-local repair 边界与候选配置产物。
- Task Package: `TK-318`、`TK-319`、`TK-320`。

## 2.3 sprint-003-role-agent-projection-and-langgraph-supervisor

- Status: completed
- Sprint Goal: 完成 `core-agent-projection` package、shared session 投影与 LangGraph supervisor 规划能力。
- Task Package: `TK-321`、`TK-322`、`TK-323`。

## 2.4 sprint-004-ui-report-rollout-and-hardening

- Status: completed
- Sprint Goal: 将 agent view 接入 CLI/report/review，补齐目标测试、adoption 文档、resolved review 与 completion audit。
- Task Package: `TK-324`、`TK-325`、`TK-326`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-316 | sprint-001 | 定义 onboarding / projection / runtime 三层契约并冻结 governor.yaml schema v2 | docs/module-baseline | `.repo-ai-governor/draft/multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md` | completed |
| TK-317 | sprint-001 | 冻结 agent descriptor 最小字段集 | docs/contract-baseline | TK-316 | completed |
| TK-318 | sprint-002 | 实现 connect 模板与路由基线生成 | runtime/onboarding | TK-316,TK-317 | completed |
| TK-319 | sprint-002 | 实现 doctor --adapters 探测与 safe_local 修复 | runtime/onboarding | TK-318 | completed |
| TK-320 | sprint-002 | 实现 verify --adapters 矩阵报告 | runtime/onboarding | TK-318,TK-319 | completed |
| TK-321 | sprint-003 | 实现 AgentProjectionService | runtime/projection | TK-316,TK-317 | completed |
| TK-322 | sprint-003 | 实现 AgentSessionRegistry | runtime/projection | TK-321 | completed |
| TK-323 | sprint-003 | 接入 LangGraph supervisor | runtime/orchestration | TK-321,TK-322 | completed |
| TK-324 | sprint-004 | 让 CLI/report 输出 agent 视图 | ui/report | TK-321,TK-323 | completed |
| TK-325 | sprint-004 | 增加集成测试与 smoke 门禁 | quality/gates | TK-318,TK-321,TK-323 | completed |
| TK-326 | sprint-004 | 输出使用文档与 adoption 指南 | docs/adoption | TK-324,TK-325 | completed |

## 4. 依赖产物策略

1. `project-028` 默认消费 formal `runtime.agent-projection` module docs 与原始 draft/review，确保实现窗口仍受已批准方案约束。
2. 本项目同时覆盖 implementation、rollout、review 与 adopter-facing docs，不再把该技术方案停留为“follow-up required but unimplemented”。
3. task 编号固定保留在 `TK-316 ~ TK-326`，保证 delivery registry、review evidence 与 adoption 文档可回链。

## 5. DoD（project-028）

1. `connect` 能生成 multi-tool onboarding 候选配置和契约产物，`doctor --adapters` / `verify --adapters` 能输出稳定诊断与矩阵报告。
2. `AgentProjectionService`、`AgentSessionRegistry` 与 LangGraph supervisor 规划能力已进入正式代码面，并可被 CLI/reporting 消费。
3. CLI、review、execution report 与 diagnostics 已具备 agent view / session projection 回链。
4. README、`README.zh-CN.md`、`docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md` 已同步为真实 adopter-facing 口径。
5. project-level resolved review、completion audit、task ledger、delivery registry 与 `current-context.md` 保持 completed 真值。

## 6. 里程碑记录

1. 2026-03-28：创建 `project-028-multi-ai-tools-onboarding-role-agent-projection`，将 approved technical solution 投影为 follow-up implementation stream。
2. 2026-03-28：完成 `sprint-001 ~ sprint-004` 四段式拆分，覆盖 contract baseline、onboarding、projection/supervisor 与 UI/report/adoption 收尾。
3. 2026-03-30：完成 `TK-316 ~ TK-317`，固定 `runtime.agent-projection` formal contract、delivery handoff 与 `AgentDescriptor` 最小字段集。
4. 2026-03-30：完成 `TK-318 ~ TK-320`，实现 `connect` 候选配置生成、`doctor --adapters` safe-local repair boundary 与 `verify --adapters` 矩阵输出。
5. 2026-03-30：完成 `TK-321 ~ TK-323`，新增 `@repo-ai-governor/core-agent-projection` package、共享 session agent view 投影与 LangGraph supervisor 规划接线。
6. 2026-03-30：完成 `TK-324 ~ TK-326`，将 agent view 接入 CLI/report/review，补齐目标测试、README/playbook，并产出 [resolved code review](./sprint-004-ui-report-rollout-and-hardening/review/resolved_code_review_project-028-full-implementation.md) 与 [completion audit summary](./project-028-multi-ai-tools-onboarding-role-agent-projection-completion-audit-summary.md)。
7. 2026-03-30：将 `current-context.md` primary stream 切换为 `project-028 / sprint-004-ui-report-rollout-and-hardening` completed closeout surface；`project-029 / sprint-004` 与 `project-028 / sprint-001 ~ sprint-003` 迁入 completed history。
