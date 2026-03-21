# TK-044 project/sprint/task 拆解助手协议模板

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-008-workflow-optimization`
- Sprint: `sprint-001-execution-workflow-optimization`

## 1. 任务目标

建立 project/sprint/task 拆解助手的输入输出协议模板，提升任务拆解速度、一致性与可审计性。

## 2. Depends On

1. `TK-041`
2. `TK-042`
3. `DA-052`
4. `DA-053`

## 3. 预期产物

1. `DA-055` decomposition assistant protocol template 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-041-cr-lifecycle-threshold-template-baseline.md` (`DA-052`)
2. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-042-task-ledger-single-write-source-contract.md` (`DA-053`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`（`§4`、`§5`，已归档）

## 5. 实施计划

1. 定义拆解输入契约（`workstream/phase/goal/constraints/dependencies`）。
2. 定义输出骨架（`plan/checklist/tasks.csv/TK`）和字段最小集。
3. 定义验收字段、验证字段与默认优先级策略。
4. 输出至少一套样例，验证可被后续 project 直接复用。

## 6. 实施摘要

1. 新增拆解协议模板文档：
   - `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
2. 固化输入契约、输出契约、任务卡最小模板与退出检查清单。
3. 对齐 `AGENTS.md` 的路径命名规则与台账同步要求。
4. 以 `project-008/sprint-001` 为样例完成协议映射验证。

## 7. 产出

1. `DA-055` `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-044-decomposition-assistant-protocol-template.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
3. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/review/verified_review_tk-044-decomposition-assistant-protocol-template.md`

## 8. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 9. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始定义拆解输入输出协议与模板骨架。
3. 2026-03-21：完成拆解协议模板与样例映射，状态切换为 `completed`，并完成 `DA-055` 登记。
