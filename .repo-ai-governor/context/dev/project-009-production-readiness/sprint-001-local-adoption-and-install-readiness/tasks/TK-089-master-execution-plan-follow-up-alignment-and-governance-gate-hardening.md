# TK-089 主执行计划后续补充对齐与治理门禁补强

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

继续补强 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`，将尚未显式落盘的执行口径收敛为主计划正文，包括 Phase 对齐、只读接入与 workspace 回滚、完整 `review-verify` 闭环、Artifact/Review/Normative gates 以及暂缓纳入 Stage 9 出口门槛的 P1 follow-up backlog。

## 2. Depends On

1. `TK-087`
2. `TK-088`

## 3. 预期产物

1. 更新后的主执行计划文档，显式纳管本轮补强点。
2. 同步后的 `project-009` project/sprint 台账入口。
3. `resolved_code_review_tk-089-master-execution-plan-follow-up-alignment-and-governance-gate-hardening.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
8. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
9. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
10. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 修正主执行计划中与 triad 不一致的 Phase 表述，避免出现未在上游定义的 `Phase F`。
2. 将只读接入、workspace 切换/rollback、完整 `review-verify` 闭环与 Artifact Registry 生命周期退出治理补入 Stage 2/5/6/9 的执行口径。
3. 为当前未纳入 `project-009` 出口门槛但仍属于 `P1 进行中` 的能力建立显式 follow-up backlog。
4. 将规范加载清单 gate 与 CR 生命周期 gate 补入并行治理主线，并同步回写 `project-009` 的 project/sprint 台账入口。

## 6. 收敛结果

1. `Stage 9` 的相位映射已统一为 `Phase E 收口 + GA Readiness overlay`，与 triad 当前 `Phase A~E` 坐标保持一致。
2. `Stage 9A/9B` 已补齐只读接入、workspace 切换/rollback 与完整 `review-verify -> report -> ledger backfill` 闭环。
3. `Stage 2/5/6` 已补齐 `Loop` 约束、Agent budget 契约与 Artifact Registry 生命周期退出治理。
4. 主计划新增 `P1 follow-up backlog`，显式挂出语言模板扩展、GitLab/Jenkins 模板与本地模型适配路径。
5. 并行治理主线新增 `normative-loading-manifest` 与 code review lifecycle sync gate，并把 Artifact Registry 生命周期治理提升为持续主线。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始将本轮补强建议落入主执行计划正文与 `project-009` 台账入口。
3. 2026-03-22：完成主执行计划与 `project-009` project/sprint 台账同步，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-089-master-execution-plan-follow-up-alignment-and-governance-gate-hardening.md`
