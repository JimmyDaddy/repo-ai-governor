# sprint-001-contract-and-routing-truth-cutover 计划

- Status: planned
- Date: 2026-04-09
- Project: `project-076-transport-selection-authority-rollout`
- Sprint Goal: 收敛 onboarding / probe / runtime contract truth，并建立 same-surface no-failover guard 与回归基线。

## 1. Task Package

1. `TK-726` converge enabled-tools canonical transport truth and compatibility bridge
2. `TK-727` implement strict transport routing fail-closed guard and probe truth alignment
3. `TK-728` add same-surface no-failover regression coverage

## 2. Exit Criteria

1. `enabled_tools[]` 成为 transport truth 的唯一 canonical machine surface。
2. runtime / probe surfaces 对显式 transport 选择采取 fail-closed，而不是同 surface 自动切换。
3. 覆盖 same-surface no-failover 的回归测试与验证基线已具备。
