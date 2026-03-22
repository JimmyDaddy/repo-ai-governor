# TK-082 多工具/多模型真实调用与无人值守自动链路

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-002-automation-observability-and-ga-rollout`

## 1. 任务目标

完成多工具/多模型真实调用与自动执行链路收敛，满足无人值守运行要求。

## 2. Depends On

1. `TK-080`
2. `TK-081`

## 3. 预期产物

1. `DA-094` 多工具/多模型真实调用与无人值守自动链路产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`（`DA-092`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 默认消费 `DA-092` 的 sprint-002 输入约束，尤其是完整闭环、风险分级、持续 gate 与 fix-forward blocker 清单。
2. 收敛 `codex/github-copilot/claude-code` 真实调用路径与能力探测。
3. 构建按 `role/capability/cost/latency/risk` 的主备路由策略，并与 `DA-092` 中的高风险 `confirm/escalate` 要求保持一致。
4. 打通 `plan -> run -> review -> review-verify -> report -> ledger backfill` 无人值守流程（命中闸口可暂停），不得回退为缺少 `review-verify` 或台账回写的半闭环。
5. 回写台账并登记可复用产物。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-092` 补齐 `DA-092` handoff、完整 `review-verify -> ledger backfill` 闭环与风险分级约束，任务状态保持 `planned`。

## 8. 产出

1. `DA-094` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-082-multi-tool-model-real-invocation-and-unattended-flow.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
