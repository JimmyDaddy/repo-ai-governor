# TK-090 Stage 9A 任务卡二次下钻与出口验收口径补强

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

在 `TK-089` 完成主执行计划补强后，将新增口径继续下钻到 `TK-075`~`TK-080`，确保 sprint-001 的任务卡、出口验收与 Stage 9B 交接条件完全对齐最新主计划。

## 2. Depends On

1. `TK-089`

## 3. 预期产物

1. 更新后的 `TK-075`~`TK-080` 任务卡，显式覆盖只读接入、workspace rollback、完整 `review-verify` 闭环与治理 gate。
2. 更新后的 `project-009` project/sprint 台账入口。
3. `resolved_code_review_tk-090-stage-9a-task-card-second-pass-and-exit-gate-hardening.md` 评审记录。

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

1. 逐张核对 `TK-075`~`TK-080` 是否已显式纳入只读接入、workspace 切换/rollback 与完整 `review-verify` 闭环。
2. 将 `normative-loading-manifest`、code review lifecycle sync、Artifact Registry 生命周期治理等 gate 下钻到任务级入口与 sprint-001 出口验收口径。
3. 同步更新 `project-009` project/sprint 计划中的任务包与里程碑记录，避免主计划、project 计划、sprint 计划与任务卡再次漂移。
4. 产出评审记录并运行任务/评审/计划同步门禁。

## 6. 收敛结果

1. `TK-075` 补齐了只读接入、既有规范复用建议与 `review/review-verify` 命令边界。
2. `TK-076`~`TK-079` 分别补齐了只读接入与 workspace rollback 诊断、clean-room 切换验证、完整闭环 examples 说明与文档接入口径。
3. `TK-080` 已显式将 Stage 9A 出口验收收紧为“只读接入 + clean-room + rollback + examples/doc readiness”，并把 Stage 9B 输入约束扩展到 `review-verify -> ledger backfill` 与持续 gate。
4. `project-009` 的 project/sprint 台账入口已登记 `TK-090` 与本轮里程碑记录。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始将 `TK-089` 的新增口径下钻到 `TK-075`~`TK-080`。
3. 2026-03-22：完成任务卡与 project/sprint 台账补强，状态切换为 `completed`。

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
11. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-090-stage-9a-task-card-second-pass-and-exit-gate-hardening.md`
