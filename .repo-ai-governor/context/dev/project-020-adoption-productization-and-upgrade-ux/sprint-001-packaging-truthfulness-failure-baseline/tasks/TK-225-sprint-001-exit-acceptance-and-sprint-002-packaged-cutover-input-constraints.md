# TK-225 sprint-001 出口验收与 sprint-002 packaged cutover 输入约束

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. 任务目标

完成 `sprint-001` 验收，并把后续 packaged runtime 真正修复所需的输入约束、风险边界与 gate cutover 前提冻结下来。

## 2. Depends On

1. `TK-222`
2. `TK-223`
3. `TK-224`
4. `DA-222`
5. `DA-223`
6. `DA-224`

## 3. 预期产物

1. sprint-001 completion summary。
2. sprint-002 packaged cutover input constraints。
3. 更新后的台账、history 与 follow-up stream 状态。
4. `DA-225`

## 4. 实施计划

1. 验证 `sprint-001` 的 baseline 与边界盘点是否达到 exit criteria。
2. 将 `sprint-002` 的 cutover 前提明确写成输入约束，避免范围漂移。
3. 同步 task/artifact/context/master-plan 等台账与必要 gates。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始基于 `DA-222`、`DA-223` 与 `DA-224` 评估 sprint-001 exit criteria，并冻结 sprint-002 的 cutover 输入约束。
3. 2026-03-26：已确认 sprint-001 的 4 条 exit criteria 均满足，形成 `DA-225`。
4. 2026-03-26：已将 sprint-001 切为 `completed`，并把 sprint-002 的输入约束冻结为“docs/skills publish surface truthfulness + support matrix 收紧 + blocking gate cutover”，不再回退到旧的 internal package resolution 假设。
