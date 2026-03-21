# TK-059 sprint-002 resilience-and-ga-readiness 输入约束清单

- Status: active
- Date: 2026-03-22
- Owner: AI-Agent
- Scope: `sprint-001 -> sprint-002` handoff

## 1. 目标

确保 `sprint-002-resilience-and-ga-readiness` 启动前具备可消费输入、可阻断门禁与可回放约束，避免受限网络回归、回滚演练与 GA 联合门禁阶段出现语义漂移。

## 2. 输入就绪检查

1. 契约测试矩阵基础能力
   - `DA-067` 已建立 Stage 7 跨包契约矩阵与守卫测试，具备可执行 contract 基线入口。
   - `test:contract` 与关键模块 `failurePolicy` 语义已固化，可作为 sprint-002 合同回归前置。
2. 分层测试稳定性基础能力
   - `DA-068` 已完成 `test:contract/test:integration/test:e2e` 分层接线与最小 e2e 样例。
   - Turbo gate 已接入 `gate:test:contract`、`gate:test:e2e`，可作为 sprint-002 稳定性回归基础执行链路。
3. 发布治理与通道基础能力
   - `DA-069` 已落地 lockstep/independent 边界、`canary -> rc -> ga` 通道策略、回滚触发与最小审计证据要求。
   - `release:check`、`release:ga-check`、`release:verify-local` 已通过，可用于 sprint-002 发布前准入基线。
4. 台账与生命周期治理约束
   - `task card/checklist/tasks.csv` 必须持续满足 `CS-021` 同步约束。
   - artifact lifecycle 必须满足 `CS-023`，仅消费 `active/frozen`，并由脚本回填 `dependent_tasks`。
5. sprint-002 任务输入映射
   - `TK-060` 必须消费 `DA-071` 与 `DA-070`，先完成受限网络/离线降级回归矩阵。
   - `TK-061` 必须消费 `DA-069` 与 `DA-072`，在稳定性回归通过后执行回滚演练。
   - `TK-062` 必须消费 `DA-072` 与 `DA-073`，收敛为 GA 候选联合门禁基线。
   - `TK-063` 必须回链 `DA-072/DA-073/DA-074`，形成 project-006 出口验收与 project-007 输入约束。

## 3. Stage 7 风险分级输入基线

1. 阻断型（BLOCK）
   - `DA-070/DA-071` 不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - 受限网络降级链路不可执行，导致治理主链路中断。
   - 发布治理通道策略与门禁执行结果不一致，或回滚流程缺失关键步骤。
2. 确认型（CONFIRM）
   - 测试样例范围扩缩但不改变分层职责语义。
   - 回滚/恢复阈值调整但不改变状态机与审批语义。
3. 自动型（AUTO_APPLY）
   - 依赖回链字段补齐与台账字段同步修正。
   - 非语义变更的命令路径、文案与记录格式收敛。

## 4. sprint-002 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:contract -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run test:e2e -- --maxWorkers=1 --maxConcurrency=1`
6. `pnpm run release:check`
7. `node ./scripts/governance/reconcile-artifact-dependencies.js`
8. `node ./scripts/governance/check-task-ledger-sync.js`
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`
10. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
11. `pnpm run check`
