# TK-043 风险判定事实契约与 HITL SLA 基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-008-workflow-optimization`
- Sprint: `sprint-001-execution-workflow-optimization`

## 1. 任务目标

建立统一风险事实结构、风险等级动作映射与 HITL 响应 SLA，稳定高风险场景的策略行为。

## 2. Depends On

1. `TK-040`
2. `DA-051`

## 3. 预期产物

1. `DA-054` risk facts contract and HITL SLA baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-040-fast-gate-and-release-gate-layering-baseline.md` (`DA-051`)
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`（`§4`、`§5`）
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`Change Risk Evaluator`、`Policy Gate Engine`）
4. `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`（`§3`、`§4`、`§6`，已归档）

## 5. 实施计划

1. 定义风险事实字段（`risk_id/category/level/evidence/scope/confidence/trigger_rule`）。
2. 定义等级到动作映射（`allow/confirm/escalate/block`）和默认超时策略。
3. 对齐高风险类型白名单与审批责任边界。
4. 形成审计字段模板，确保触发、通知、结论、耗时可追踪。

## 6. 实施摘要

1. 新增风险契约文档：
   - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`
2. 固化风险事实 schema（v1）与示例，统一风险判定输入。
3. 固化 `L1/L2/L3/L4` 到 `allow/confirm/escalate/block` 动作映射。
4. 固化 HITL SLA：
   - `confirm` 4 小时；
   - `escalate` 2 小时；
   - 超时默认 `block`。
5. 固化高风险类型白名单与审计必备字段。

## 7. 产出

1. `DA-054` `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-043-risk-facts-contract-and-hitl-sla-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`
3. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/review/verified_review_tk-043-risk-facts-contract-and-hitl-sla-baseline.md`

## 8. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 9. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始定义风险事实字段、等级动作映射与 HITL SLA 初值。
3. 2026-03-21：完成风险事实契约与 HITL SLA 规范，状态切换为 `completed`，并完成 `DA-054` 登记。
