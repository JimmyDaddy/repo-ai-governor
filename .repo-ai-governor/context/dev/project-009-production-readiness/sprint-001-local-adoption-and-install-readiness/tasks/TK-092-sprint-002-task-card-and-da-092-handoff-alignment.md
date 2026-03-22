# TK-092 sprint-002 任务卡与 DA-092 handoff 约束对齐

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

在 `TK-091` 固化 `DA-092` 模板骨架后，将 sprint-002 的 `TK-081`~`TK-085` 任务卡显式对齐到 `DA-092`，确保 Stage 9B 不会绕过 sprint-001 的 handoff 约束直接推进实现。

## 2. Depends On

1. `TK-091`

## 3. 预期产物

1. 更新后的 `TK-081`~`TK-085` 任务卡，显式消费 `DA-092` 作为唯一输入入口。
2. 更新后的 `project-009` project/sprint 计划入口。
3. `resolved_code_review_tk-092-sprint-002-task-card-and-da-092-handoff-alignment.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-081-release-distribution-model-and-runtime-resolvable-packaging.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-082-multi-tool-model-real-invocation-and-unattended-flow.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-083-role-level-progress-log-and-human-friendly-interaction.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-084-blackbox-e2e-and-gate-tightening.md`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-085-ci-and-release-pipeline-productionization.md`
11. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
12. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 逐张核对 `TK-081`~`TK-085` 是否已把 `DA-092` 明确写为唯一输入入口与 blocker 来源。
2. 将完整 `review-verify -> ledger backfill` 闭环、双黑盒主路径与持续 gate 前置下钻到对应任务卡。
3. 同步更新 sprint-002 计划的 Entry/Exit Criteria，使其与 `DA-092` handoff 语义一致。
4. 回写 sprint-001 台账并产出评审记录，确认本轮仅为 handoff 对齐，不扩大 sprint-002 范围。

## 6. 收敛结果

1. `TK-081`~`TK-085` 均新增 `DA-092` 为输入引用，并显式要求消费 sprint-001 blocker/fix-forward 约束。
2. `TK-082` 与 `TK-084` 已收紧为完整 `plan -> run -> review -> review-verify -> report -> ledger backfill` 及双黑盒主路径。
3. `TK-083` 已补齐完整闭环状态字典与失败归因展示要求。
4. `TK-085` 已补齐 workflow 显式消费 `DA-092` 与 `release:ga-check` 覆盖持续 gate 的要求。
5. sprint-002 计划的 Entry/Exit Criteria 已与 `DA-092` handoff 口径同步。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始将 `DA-092` handoff 约束下钻到 sprint-002 任务卡。
3. 2026-03-22：完成 sprint-002 任务卡与计划入口同步，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-081-release-distribution-model-and-runtime-resolvable-packaging.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-082-multi-tool-model-real-invocation-and-unattended-flow.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-083-role-level-progress-log-and-human-friendly-interaction.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-084-blackbox-e2e-and-gate-tightening.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-085-ci-and-release-pipeline-productionization.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
11. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-092-sprint-002-task-card-and-da-092-handoff-alignment.md`
