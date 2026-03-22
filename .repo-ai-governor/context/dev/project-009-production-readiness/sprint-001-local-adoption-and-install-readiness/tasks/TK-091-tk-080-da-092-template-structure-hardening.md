# TK-091 TK-080 验收模板骨架与 DA-092 结构化入口固化

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

将 `TK-080` 从“描述验收意图的任务卡”补强为“可直接承载 `DA-092` 证据与结论的结构化模板”，避免 sprint-001 真正执行出口验收时再次临时设计文档结构。

## 2. Depends On

1. `TK-090`

## 3. 预期产物

1. 更新后的 `TK-080`，包含 `DA-092` 验收矩阵与 Stage 9B 输入约束模板骨架。
2. 同步后的 `project-009` project/sprint 台账入口。
3. `resolved_code_review_tk-091-tk-080-da-092-template-structure-hardening.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
5. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-068-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
6. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-073-project-007-exit-acceptance-and-rollout-input-constraints.md`
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
8. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 参考既有出口验收/输入约束任务卡结构，为 `TK-080` 增加可直接填写的 `DA-092` 模板章节。
2. 将 Stage 9A 的关键验收项整理为固定矩阵，避免后续执行时遗漏只读接入、workspace rollback、examples/doc readiness 与持续 gate。
3. 将 Stage 9B 的 handoff 条件整理为固定模板，显式约束完整闭环、风险分级、治理 gate 与依赖回链。
4. 同步更新 project/sprint 台账与评审记录，确保模板化动作可审计。

## 6. 收敛结果

1. `TK-080` 新增 `DA-092` 模板使用说明，明确该任务卡本身即验收产物入口。
2. `TK-080` 新增 Stage 9A 验收矩阵，覆盖 CLI、只读接入、clean-room、workspace rollback、diagnostics、examples、docs 与持续 gate。
3. `TK-080` 新增 Stage 9B 输入约束模板，覆盖完整自动闭环、治理 gate、风险分级、试点前置与依赖产物回链。
4. `project-009` project/sprint 计划已登记 `TK-091` 与本轮里程碑。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始为 `TK-080` 固化 `DA-092` 模板骨架。
3. 2026-03-22：完成 `TK-080` 模板化与 project/sprint 台账同步，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-091-tk-080-da-092-template-structure-hardening.md`
