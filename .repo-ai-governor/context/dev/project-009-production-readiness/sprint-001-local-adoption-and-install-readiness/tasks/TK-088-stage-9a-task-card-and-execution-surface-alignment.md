# TK-088 Stage 9A 任务卡与执行面主计划对齐

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

将 `TK-075`~`TK-080` 的任务卡口径与 `project-009` 当前执行面收敛到最新 Stage 9A/9B 主计划要求，防止主执行计划、sprint 计划与任务卡之间再次漂移。

## 2. Depends On

1. `TK-087`

## 3. 预期产物

1. 更新后的 `TK-075`~`TK-080` 任务卡，显式覆盖 Stage 9A 硬门槛、`DA-092` 交接语义与 clean-room/examples/docs 约束。
2. 更新后的 `project-009` project/sprint 计划台账。
3. `resolved_code_review_tk-088-stage-9a-task-card-and-execution-surface-alignment.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-076-local-debug-trace-replay-and-diagnostics-baseline.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-local-installation-modes-and-cleanroom-validation.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-078-examples-assets-and-example-smoke-gate.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-079-user-docs-and-local-adoption-playbook.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
10. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
11. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
12. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 逐张核对 `TK-075`~`TK-080` 与 Stage 9A Hard Exit/Stage 9B Entry Gate 的语义缺口。
2. 将 CLI、诊断、clean-room、examples、文档与出口验收的硬约束直接下钻到对应任务卡。
3. 同步更新 `project-009` 的 project/sprint 计划、checklist 与 `tasks.csv`，记录本次对齐动作。
4. 产出评审记录，确认本次对齐未引入新的流程漂移。

## 6. 收敛结果

1. `TK-075` 补齐 `init/doctor/check` Stage 9A 硬门槛、CLI `json` 契约迁移与 `DA-092` 交接说明。
2. `TK-076`~`TK-079` 分别补齐诊断归因、两种安装模式连续 3 次 clean-room 验证、`scripts/examples/` 强制目录与 5~15 分钟独立接入文档口径。
3. `TK-080` 明确为 Stage 9A 出口验收与 Stage 9B 唯一入口约束任务。
4. `project-009` 的 project/sprint 计划出口条件同步收紧到最新 Stage 9A 口径。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛 `TK-075`~`TK-080` 与主执行计划的差距。
3. 2026-03-22：完成任务卡与 project/sprint 台账对齐，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-076-local-debug-trace-replay-and-diagnostics-baseline.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-local-installation-modes-and-cleanroom-validation.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-078-examples-assets-and-example-smoke-gate.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-079-user-docs-and-local-adoption-playbook.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
11. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-088-stage-9a-task-card-and-execution-surface-alignment.md`
