# sprint-003-react-cli-shell-default-cutover 计划

- Status: planned
- Date: 2026-03-28
- Project: `project-027-cli-interactive-shell-implementation`

## 1. Sprint Goal

完成默认切换策略、`upgrade` 收尾与文档/验证闭环，使 React shell 成为主要交互 surface。

## 2. Task Package

1. `TK-312` 默认切换策略与 `init` React 默认启用（planned）
2. `TK-313` `upgrade` 路径、确认层与 rollback reference polish（planned）
3. `TK-314` adopter 文档、playbook 与 help surface 收尾（planned）
4. `TK-315` project-027 出口验收与 completion audit（planned）

## 3. Exit Criteria

1. `init` 的默认交互切换策略落地，且具备 classic fallback。
2. `upgrade` 的确认、回滚参考与失败提示进入正式路径。
3. 形成面向 adopter 的文档、playbook 与最终验收记录。

## 4. Completion Notes

1. 这个 sprint 只在 surface-expansion 完成后开启。
2. 仅在 `--no-interactive`、非 TTY 与 machine output contract 已经稳定的前提下讨论默认切换。
