# TK-082 多工具/多模型真实调用与无人值守自动链路

- Status: planned
- Date: 2026-03-23
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
7. `.repo-ai-governor/draft/multi-ai-tools-fast-onboarding-technical-solution.md`

## 5. 实施计划

1. 默认消费 `DA-092` 的 sprint-002 输入约束，尤其是完整闭环、风险分级、持续 gate 与 fix-forward blocker 清单。
2. 落地 `connect -> doctor --adapters -> verify --adapters` 接入主路径，并覆盖 `codex/github-copilot/claude-code` 真实调用路径与能力探测。
3. 阶段 A 直接引入 `adapters/routing` 必需配置：`roles` 承载语义，`routing.roleBindings` 承载角色到工具主备绑定，必须支持同一工具绑定多个角色（如 codex 覆盖全流程角色）。
4. 构建按 `role/capability/cost/latency/risk` 的主备路由策略，并与 `DA-092` 中的高风险 `confirm/escalate` 要求保持一致。
5. 固化 `doctor --fix` 自动修复边界：仅允许 `safe_local`（目录、模板配置、文件格式、可写权限）；登录/鉴权、代理改写、权限上限提升、发布部署类动作只输出 `nextAction`。
6. 固化 `verify --adapters` 通过门槛：`pass`=必需角色均有可用 primary（或可用 fallback）；`warn`=存在降级但不影响闭环；`fail`=必需角色不可用或闭环能力缺口。
7. 打通 `plan -> run -> review -> review-verify -> report -> ledger backfill` 无人值守流程（命中闸口可暂停），不得回退为缺少 `review-verify` 或台账回写的半闭环。
8. 默认仅写 diagnostics artifact；仅在显式参数（如 `--record-ledger --task-id`）下回写任务台账，并登记可复用产物。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`
4. `pnpm run test:packages -- apps/cli/test --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-092` 补齐 `DA-092` handoff、完整 `review-verify -> ledger backfill` 闭环与风险分级约束，任务状态保持 `planned`。
3. 2026-03-23：已将多工具便捷接入草案中的采纳结论反哺本任务卡，新增 `adapters/routing` 必需配置、`safe_local` 自动修复边界、`verify` 判定门槛与默认台账回写策略约束，状态保持 `planned`。

## 8. 产出

1. `DA-094` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-082-multi-tool-model-real-invocation-and-unattended-flow.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
