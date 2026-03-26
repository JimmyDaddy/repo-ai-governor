# sprint-003-optional-plugin-mode-and-policy-hardening 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-015-memory-provider-pluginization`

## 1. Sprint Goal

在受控 allowlist / prefix / path / module policy 下打开 optional plugin mode，建立 plugin-enabled distribution 与 clean-room/examples/release gate 基线，并冻结 sprint-004 service reuse 输入约束。

## 2. Task Package

1. `TK-171` memory provider plugin allowlist 与 registry resolution contract baseline（completed）
2. `TK-172` CLI memory provider plugin loader cutover 与 dual-input compatibility（completed）
3. `TK-173` plugin-enabled distribution、clean-room、examples 与 release gate expansion（completed）
4. `TK-174` sprint-003 出口验收与 sprint-004 service reuse 输入约束（completed）

## 3. Exit Criteria

1. `provider.module / exportName / options` 的可控解析契约已形成正式基线。
2. optional plugin mode 不允许任意模块执行，allowlist / prefix / path policy 已收敛为正式门禁。
3. plugin-enabled distribution、clean-room、examples/runtime smoke 与 release gate 已与 default distribution 区分验证。
4. sprint-003 的验收与 sprint-004 service reuse 输入约束已形成正式基线。

## 4. Execution Notes

1. 本 sprint 只承接 Phase 2 `optional plugin mode`，不把 service reuse 实装混入同一轮实现。
2. 任意模块执行入口不在本 sprint 承诺范围内；所有 plugin 解析必须先经过 allowlist / prefix / path policy。
3. sprint-004 再承接 CLI / desktop / service-backed runtime 的共享 loader reuse。
4. 当前 sprint 已判定为 `accept`，但 `current-context` 仍暂留在 sprint-003，待下一条主执行流明确后再迁入 completed history。
