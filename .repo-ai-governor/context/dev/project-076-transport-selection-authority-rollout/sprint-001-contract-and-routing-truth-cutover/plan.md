# sprint-001-contract-and-routing-truth-cutover 计划

- Status: completed
- Date: 2026-04-09
- Project: `project-076-transport-selection-authority-rollout`
- Sprint Goal: 收敛 onboarding / probe / runtime contract truth，并建立 same-surface no-failover guard 与回归基线。

## 1. Task Package

1. `TK-726` converge enabled-tools canonical transport truth and compatibility bridge
2. `TK-727` implement strict transport routing fail-closed guard and probe truth alignment
3. `TK-728` add same-surface no-failover regression coverage
4. `TK-735` sprint-001 exit acceptance and sprint-002 activation handoff

## 2. Exit Criteria

1. `enabled_tools[]` 成为 transport truth 的唯一 canonical machine surface。
2. runtime / probe surfaces 对显式 transport 选择采取 fail-closed，而不是同 surface 自动切换。
3. 覆盖 same-surface no-failover 的回归测试与验证基线已具备。

## 3. Milestones

1. 2026-04-09：作为 `project-076` 的第一阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-09：`TK-726`、`TK-727`、`TK-728` 已完成实现，`pnpm run build` 与 sprint-001 targeted vitest 回归集通过；下一边界进入 sprint-scoped CR loop。
3. 2026-04-09：`CR-001` 已 resolved，`TK-735 / DA-735` 已完成 sprint-001 closeout 与 sprint-002 activation handoff。
