# TK-081 发布分发模型与运行时可解析打包收敛

- Status: completed
- Date: 2026-03-23
- Owner: AI-Agent
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-002-automation-observability-and-ga-rollout`

## 1. 任务目标

确保发布形态在运行时可解析、可执行，消除未发布内部依赖风险。

## 2. Depends On

1. `TK-080`

## 3. 预期产物

1. `DA-093` 发布分发模型与运行时可解析打包收敛产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`（`DA-092`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 默认消费 `DA-092` 中关于 clean-room、workspace rollback、read-only attach 边界与 blocker/fix-forward 的 handoff 约束，禁止脱离 sprint-001 基线重新定义发布入口。
2. 收敛单包 bundle / 多包发布策略并给出落地选择依据，确保运行时产物不依赖未发布 workspace 包名。
3. 修复运行时依赖解析路径，确保 clean-room 场景可执行，并保留 Stage 9A 已通过的安装模式复用路径。
4. 将 clean-room 安装验证与 `release:ga-check` / 候选发布门禁接线，保持对 Stage 9A 基线的持续回归。
5. 回写台账并登记可复用产物。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-092` 补齐 `DA-092` handoff 约束、clean-room 基线复用与 release gate 对齐要求，任务状态保持 `planned`。
3. 2026-03-23：任务启动，状态切换为 `in_progress`，开始收敛发布分发模型、运行时依赖解析与 clean-room/release 候选门禁接线。
4. 2026-03-23：完成发布分发模型与运行时可解析打包收敛，新增 dist 内部 package 快照复制、根依赖补齐、release candidate clean-room 接线与本地采用文档同步，状态切换为 `completed`。
5. 2026-03-23：完成 `code_review_tk-081-working-tree-follow-up-20260323-1057` 复核与修复，修复 clean-room 默认报告路径覆写历史证据问题，并将复核报告收敛为 `resolved` 状态。

## 8. 产出

1. `DA-093` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/DA-093-release-distribution-model-and-runtime-resolvable-packaging.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
