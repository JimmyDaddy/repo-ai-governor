# TK-087 主执行计划 Stage 9 分阶段门槛与 GA 信号补强

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

补强 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`，使 Stage 9 的执行路径与当前 `project-009` 实际拆解一致，并补齐分阶段硬门槛、GA 量化信号、适配器投产验收与 examples 强约束。

## 2. Depends On

1. `DA-086`

## 3. 预期产物

1. 更新后的主执行计划文档，明确 Stage 9A/9B 门槛与 GA 信号。
2. `resolved_code_review_tk-087-master-execution-plan-stage-9-gates-and-ga-metrics-hardening.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-007-platformization/project-007-platformization-completion-audit-summary.md`
5. `.repo-ai-governor/context/dev/project-008-workflow-optimization/project-008-workflow-optimization-completion-audit-summary.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
8. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 将 Stage 9 从单段任务列表补强为与 `project-009` 一致的 9A/9B 两段门槛。
2. 将 GA 成功标准从纯描述补强为可执行量化信号。
3. 补齐适配器投产验收、命令兼容迁移与 `scripts/examples/` 强约束。
4. 回写 `project-009` 的 project/sprint 台账，避免主计划与执行流漂移。

## 6. 收敛结果

1. 新增 `Stage 9A: Local Adoption Readiness` 与 `Stage 9B: Automation + GA Operations` 的硬门槛定义。
2. 新增 Stage 状态矩阵，显式回链 `project-001`~`project-009` 与 `project-008` 的跨阶段优化定位。
3. 新增 `GA Readiness 量化信号（最小）`，覆盖试点接入、clean-room 安装、黑盒矩阵、无人值守 rehearsal 与结构化归因。
4. Stage 9 交付清单补齐：
   - CLI `json` 输出兼容迁移策略
   - 适配器投产验收项
   - `scripts/examples/` 强制目录约束
   - 黑盒路径中显式覆盖 `doctor`

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
4. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛主执行计划与 `project-009` 当前拆解的差距。
3. 2026-03-22：完成主执行计划与 `project-009` 台账补强，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-087-master-execution-plan-stage-9-gates-and-ga-metrics-hardening.md`
