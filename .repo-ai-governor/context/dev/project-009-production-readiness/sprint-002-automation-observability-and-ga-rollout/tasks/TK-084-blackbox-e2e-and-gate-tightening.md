# TK-084 黑盒 E2E 与门禁收紧基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-002-automation-observability-and-ga-rollout`

## 1. 任务目标

建立真实用户路径黑盒 E2E 并收紧门禁策略，减少假阳性通过。

## 2. Depends On

1. `TK-081`
2. `TK-082`
3. `TK-083`

## 3. 预期产物

1. `DA-096` 黑盒 E2E 与门禁收紧基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`（`DA-092`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 默认消费 `DA-092` 中的黑盒、试点与治理 gate 前置条件，禁止回退为仅仓库内 smoke 的自证路径。
2. 建立两条黑盒 E2E 主路径：`只读接入 -> init -> doctor -> check` 与 `plan -> run -> review -> review-verify -> report/replay`。
3. 对关键测试入口收紧 `passWithNoTests` 依赖，并保持 Stage 9A 的 clean-room/examples/read-only attach 基线可复跑。
4. 增加高风险发布路径回归（限流/超时/fallback/受限网络），同时纳入 `normative-loading-manifest`、code review lifecycle sync 与 Artifact Registry 生命周期治理等持续 gate 验证。
5. 回写台账并登记可复用产物。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-092` 补齐 `DA-092` handoff、双黑盒主路径与持续 gate 前置要求，任务状态保持 `planned`。

## 8. 产出

1. `DA-096` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-084-blackbox-e2e-and-gate-tightening.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
