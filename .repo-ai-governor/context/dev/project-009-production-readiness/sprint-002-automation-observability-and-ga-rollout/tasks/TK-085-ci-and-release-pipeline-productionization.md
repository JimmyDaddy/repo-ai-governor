# TK-085 CI 与发布流水线生产化接线

- Status: completed
- Date: 2026-03-23
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-002-automation-observability-and-ga-rollout`

## 1. 任务目标

将质量与发布候选链路接入真实 workflow 并补齐回滚与失败信号。

## 2. Depends On

1. `TK-081`
2. `TK-084`

## 3. 预期产物

1. `DA-097` CI 与发布流水线生产化接线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`（`DA-092`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 默认消费 `DA-092` 中关于持续 gate、blackbox 前置、clean-room/read-only attach 复用与 blocker/fix-forward 的输入约束。
2. 将 `integrations/ci` 模板落地到 `.github/workflows`，并确保 workflow 显式消费 `DA-092` 约束而非隐式依赖仓库上下文。
3. 接线 candidate/rc/ga 流程与失败退出信号，使 `release:ga-check` 覆盖 clean-room、双黑盒主路径与持续 gate。
4. 补齐发布失败回滚与审计回链字段。
5. 回写台账并登记可复用产物。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-092` 补齐 `DA-092` handoff、workflow 显式消费与 `release:ga-check` 覆盖要求，任务状态保持 `planned`。
3. 2026-03-23：任务启动，状态切换为 `in_progress`，开始落地 `.github/workflows` 生产化接线、Stage9 handoff 显式校验与 release channel 失败回滚信号。
4. 2026-03-23：任务完成，已落地 `quality-gate/release-governance` 真实 workflows、`check:stage9-handoff` 显式约束校验与 GA 失败回滚信号链路，补齐 `DA-097` 并通过台账同步门禁与全量 `pnpm run check`，状态切换为 `completed`。

## 8. 产出

1. `DA-097` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/DA-097-ci-and-release-pipeline-productionization.md`
2. `.github/workflows/quality-gate.yml`
3. `.github/workflows/release-governance.yml`
4. `integrations/ci/github-actions/quality-gate.yml`
5. `integrations/ci/github-actions/release-governance.yml`
6. `scripts/ci/check-stage9-handoff-constraints.js`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
