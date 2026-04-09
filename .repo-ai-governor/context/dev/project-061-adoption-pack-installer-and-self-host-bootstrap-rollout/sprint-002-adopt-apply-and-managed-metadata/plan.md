# sprint-002-adopt-apply-and-managed-metadata 计划

- Status: completed
- Date: 2026-04-09
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint Goal: 打通 `adopt apply` materialization pipeline，并补齐 managed ownership 与 install receipt。

## 1. Task Package

1. `TK-658` implement adopt apply installer and materialization pipeline
2. `TK-659` write managed ownership install receipt and adoption metadata baseline
3. `TK-669` sprint-002 exit acceptance and sprint-003 handoff readiness

## 2. Exit Criteria

1. installer 能一次性写入 shared assets、host projection 与 adoption metadata。
2. install receipt 与 managed ownership 可区分 tool-managed output 与用户后续 drift。
3. `adopt apply` 不再要求用户手工拼接低层 host export / pack 步骤。

## 3. Milestones

1. 2026-04-09：创建 `sprint-002-adopt-apply-and-managed-metadata`，待 `sprint-001` 收口后激活。
2. 2026-04-09：`TK-658`、`TK-659` 与 `TK-669` 已全部完成，`sprint-002` 已固定为 `completed`，下一边界切换到 `sprint-003-complete-pack-content-and-host-materialization`。
