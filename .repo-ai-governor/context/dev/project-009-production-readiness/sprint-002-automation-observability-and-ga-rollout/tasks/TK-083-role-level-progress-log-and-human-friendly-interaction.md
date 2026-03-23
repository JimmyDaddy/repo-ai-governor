# TK-083 角色级进度日志与人类友好交互展示

- Status: in_progress
- Date: 2026-03-23
- Owner: AI-Agent
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-002-automation-observability-and-ga-rollout`

## 1. 任务目标

实现人类友好的角色进度、关键日志与交互提示，并与审计回放一致回链。

## 2. Depends On

1. `TK-080`
2. `TK-082`

## 3. 预期产物

1. `DA-095` 角色级进度日志与人类友好交互展示产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`（`DA-092`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. 实施计划

1. 默认消费 `DA-092` 中关于完整闭环、持续 gate 与 HITL 提示的输入约束，确保展示层反映的是真实 handoff 语义而非简化流程。
2. 建立 `role/stage/status` 进度展示模型与状态字典，覆盖 `review-verify`、`ledger backfill`、`policy_waiting`、`human_confirmation` 等关键状态。
3. 实现日志分层（摘要/详细）与错误上下文增强，并显式展示策略/HITL、环境前置、权限确认与运行时缺陷等归因分类。
4. 在 HITL、权限确认、失败重试节点提供可执行下一步提示。
5. 确保展示层与 audit/replay 事件字段一一回链。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-092` 补齐 `DA-092` handoff 语义、完整闭环状态字典与失败归因展示要求，任务状态保持 `planned`。
3. 2026-03-23：任务启动，状态切换为 `in_progress`，开始收敛角色级进度模型、分层日志与人类友好交互提示。
4. 2026-03-23：完成第一批实现：新增 `ExecutionProgressStage/Status` 与交互分类常量，CLI 输出契约新增 `experience`（角色进度/分层日志/交互提示），`connect/doctor/verify/run/replay/review/review-verify` 已接入统一进度模型并补齐 `policy_waiting`、`human_confirmation`、`review_verify`、`ledger_backfill` 关键状态，且通过 TypeScript、CLI 集成测试与全量 `pnpm run check`。

## 8. 产出

1. `DA-095` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-083-role-level-progress-log-and-human-friendly-interaction.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
