# TK-063 project-007-platformization 输入约束清单

- Status: active
- Date: 2026-03-22
- Owner: AI-Agent
- Scope: `project-006 -> project-007` handoff

## 1. 目标

确保 `project-007-platformization` 启动时复用 Stage 7 已验收能力边界，避免在平台化阶段重复定义硬化与发布治理语义。

## 2. 输入就绪检查

1. Stage 7 基线产物可检索
   - `DA-072`：受限网络与离线降级回归入口已稳定。
   - `DA-073`：回滚演练与恢复流程基线已落地。
   - `DA-074`：GA 候选联合门禁基线已落地。
   - `DA-075`：project-006 出口验收结论可回链。
2. 门禁链路可复跑
   - `test:resilience` 维持通过。
   - `release:rollback-rehearsal` 维持通过并产生结构化报告。
   - `release:ga-candidate-unified-gate` 维持通过并产生结构化报告。
3. 台账与生命周期治理一致
   - `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-artifact-registry-lifecycle` 均通过。

## 3. Stage 8 风险分级输入基线

1. 阻断型（BLOCK）
   - 平台化改造导致 `release:ga-candidate-unified-gate` 失效或绕过。
   - 回滚演练报告字段缺失，无法回放定位。
   - 产物生命周期状态漂移导致 `DA-072` ~ `DA-075` 不可消费。
2. 确认型（CONFIRM）
   - 平台化入口新增后引入新的发布通道映射，但未改变 Stage 7 核心语义。
   - 审计报告格式扩展，但保留既有关键字段兼容。
3. 自动型（AUTO_APPLY）
   - 文案、路径、索引回链字段补齐。
   - 非语义性命令编排收敛。

## 4. project-007 启动前推荐命令

1. `pnpm run test:resilience`
2. `pnpm run release:rollback-rehearsal`
3. `pnpm run release:ga-candidate-unified-gate`
4. `node ./scripts/governance/reconcile-artifact-dependencies.js`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
8. `pnpm run check`
