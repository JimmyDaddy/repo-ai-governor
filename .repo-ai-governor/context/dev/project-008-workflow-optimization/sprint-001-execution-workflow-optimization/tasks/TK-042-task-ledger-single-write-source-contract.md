# TK-042 台账单一写入源契约与同步机制设计

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-008-workflow-optimization`
- Sprint: `sprint-001-execution-workflow-optimization`

## 1. 任务目标

定义“`TK` 主写入源 + `checklist/tasks.csv` 自动对齐”的契约与同步机制，降低 `CS-021` 漂移风险。

## 2. Depends On

1. `TK-040`
2. `DA-051`

## 3. 预期产物

1. `DA-053` task ledger single write source contract 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-040-fast-gate-and-release-gate-layering-baseline.md` (`DA-051`)
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`）
3. `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`（`§3`、`§4`、`§7`，已归档）

## 5. 实施计划

1. 定义 `TK` 最小字段契约与字段变更策略。
2. 设计台账同步触发时机（任务创建/状态更新/收尾归档）。
3. 定义漂移检测、自动修复与人工回滚策略。
4. 输出迁移步骤，确保现有任务数据可平滑过渡。

## 6. 实施摘要

1. 新增台账单一写源契约：
   - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
2. 固化 `TK` 主写入源原则与最小字段集，明确 `checklist/tasks.csv` 为衍生台账。
3. 固化同步触发策略：
   - 创建任务、状态变更、收尾归档三类触发。
4. 固化冲突处理与漂移治理：
   - 先修主源，再修衍生台账；
   - 每次状态变更后执行 `CS-021` 相关核验脚本。

## 7. 产出

1. `DA-053` `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-042-task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
3. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/review/verified_review_tk-042-task-ledger-single-write-source-contract.md`

## 8. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 9. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始定义 TK 主写入源字段契约与同步触发策略。
3. 2026-03-21：完成台账单写源契约与漂移治理规则，状态切换为 `completed`，并完成 `DA-053` 登记。
