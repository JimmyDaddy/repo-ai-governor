# sprint-004-diff-upgrade-remove-and-adoption-verify 计划

- Status: planned
- Date: 2026-04-09
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint Goal: 补齐 installer lifecycle 的 `diff/upgrade/remove` 与 adoption-level verify / managed bundle support。

## 1. Task Package

1. `TK-662` implement adopt diff upgrade remove lifecycle and drift-safe update policy
2. `TK-663` extend adoption verify and managed bundle artifact support

## 2. Exit Criteria

1. `diff/upgrade/remove` 能针对 managed ownership 正确 fail-closed。
2. adoption verify 能检查 provenance、drift、receipt 与 managed bundle artifact。
3. installer lifecycle 已具备正式可持续管理语义，而不是一次性写文件。

## 3. Milestones

1. 2026-04-09：创建 `sprint-004-diff-upgrade-remove-and-adoption-verify`，待 complete pack content 与 host materialization 稳定后激活。
