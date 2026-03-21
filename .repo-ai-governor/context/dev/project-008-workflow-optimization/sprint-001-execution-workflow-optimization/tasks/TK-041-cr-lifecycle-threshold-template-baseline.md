# TK-041 CR 生命周期阈值模板基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-008-workflow-optimization`
- Sprint: `sprint-001-execution-workflow-optimization`

## 1. 任务目标

定义 `review -> verified -> resolved` 生命周期阈值模板，降低状态切换主观差异并提升评审可预测性。

## 2. Depends On

1. `TK-040`
2. `DA-051`

## 3. 预期产物

1. `DA-052` CR lifecycle threshold template baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-040-fast-gate-and-release-gate-layering-baseline.md` (`DA-051`)
2. `AGENTS.md`（`默认 CR 生命周期`）
3. `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`（`§3`、`§4`，已归档）

## 5. 实施计划

1. 定义三态进入条件最小必备字段与证据格式。
2. 约束 review 文件追加规则与重命名规则，避免生命周期分叉。
3. 给出状态切换异常案例及处理策略（豁免/阻塞/回退）。
4. 输出模板示例，供后续 sprint 直接套用。

## 6. 实施摘要

1. 新增 CR 生命周期阈值规范：
   - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
2. 固化三态进入条件：
   - `review`：发现输出完成。
   - `verified`：逐条结论 + 证据命令完整。
   - `resolved`：accepted 项处置完成并完成复验。
3. 固化生命周期迁移规则：
   - 复查结果必须追加在同一 CR 文件。
   - 通过重命名推进 `review_ -> verified_review_ -> resolved_review_`。
4. 补齐异常处理规则：
   - `deferred` 必须含阻塞原因、责任人与处理窗口。
   - 高风险 deferred 项需触发 HITL。

## 7. 产出

1. `DA-052` `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-041-cr-lifecycle-threshold-template-baseline.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
3. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/review/verified_review_tk-041-cr-lifecycle-threshold-template-baseline.md`

## 8. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 9. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始沉淀 `review -> verified -> resolved` 阈值模板与证据规则。
3. 2026-03-21：完成 CR 生命周期阈值规范与迁移规则，状态切换为 `completed`，并完成 `DA-052` 登记。
