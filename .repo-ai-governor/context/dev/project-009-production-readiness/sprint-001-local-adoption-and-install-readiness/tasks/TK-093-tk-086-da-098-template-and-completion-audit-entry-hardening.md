# TK-093 TK-086 项目出口验收模板与完成态审计入口固化

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

将 `TK-086` 从“描述 project-009 收尾意图的任务卡”补强为“可直接承载 `DA-098` 项目出口验收、30 天运营反馈和 completion audit summary 交接的结构化模板”，避免项目真正收尾时再次临时设计文档结构。

## 2. Depends On

1. `TK-092`

## 3. 预期产物

1. 更新后的 `TK-086`，包含 `DA-098` 验收矩阵、运营反馈模板与 completion audit summary 入口说明。
2. 同步后的 `project-009` project/sprint 计划入口。
3. `resolved_code_review_tk-093-tk-086-da-098-template-and-completion-audit-entry-hardening.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-086-project-009-exit-acceptance-and-operations-feedback-loop.md`
5. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-006-exit-acceptance-and-project-007-input-constraints.md`
6. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-073-project-007-exit-acceptance-and-rollout-input-constraints.md`
7. `.repo-ai-governor/context/dev/project-007-platformization/project-007-platformization-completion-audit-summary.md`
8. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
9. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 参考既有 project 出口验收与 completion audit summary 样例，为 `TK-086` 增加可直接填写的 `DA-098` 模板章节。
2. 将 Stage 9B 关键验收项、试点接入反馈、30 天运营反馈与 SLO/缺陷分级整理为固定模板。
3. 将 `project-009-completion-audit-summary.md` 与 plan 里程碑回链要求纳入 `TK-086` 的强制收尾路径。
4. 同步更新 project/sprint 台账与评审记录，确保模板化动作可审计。

## 6. 收敛结果

1. `TK-086` 新增 `DA-098` 模板使用说明，明确该任务卡本身即项目级出口验收入口。
2. `TK-086` 新增 project-009 出口验收矩阵，覆盖 `DA-093`~`DA-097`、Stage 9A 基线持续复用与项目总体验收结论。
3. `TK-086` 新增试点接入与 30 天运营反馈模板，覆盖接入耗时、成功率、人工介入率、SLO 与缺陷分级。
4. `TK-086` 新增 completion audit summary 与 plan 里程碑回链交接要求，满足项目关闭协议。
5. `project-009` 与 sprint-002 计划已同步收紧到 `DA-098 + completion audit summary` 出口要求。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始为 `TK-086` 固化 `DA-098` 与 completion audit summary 模板骨架。
3. 2026-03-22：完成 `TK-086` 模板化与 project/sprint 台账同步，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-086-project-009-exit-acceptance-and-operations-feedback-loop.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-093-tk-086-da-098-template-and-completion-audit-entry-hardening.md`
