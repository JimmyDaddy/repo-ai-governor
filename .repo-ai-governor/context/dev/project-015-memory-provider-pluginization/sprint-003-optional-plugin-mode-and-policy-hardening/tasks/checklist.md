# checklist

- [x] TK-171 memory provider plugin allowlist 与 registry resolution contract baseline
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始收敛 optional plugin mode 的 allowlist / prefix / path / module policy 与 registry resolution contract baseline。
  - 2026-03-26：任务完成，已建立 plugin allowlist/prefix/path policy、plugin factory / resolution contract 与 config fail-closed 校验，并同步 `DA-171`、resolved review 和台账。
- [x] TK-172 CLI memory provider plugin loader cutover 与 dual-input compatibility
  - 2026-03-26：任务创建，状态初始化为 `planned`。
- 2026-03-26：状态切换为 `in_progress`，开始将 CLI loader 正式切到 `provider.module` 受控解析路径，并补齐 dual-input compatibility 与 diagnostics。
- 2026-03-26：任务完成，CLI 已通过统一 registry loader 支持 `storeEngine / provider.id / provider.module`，并补齐 plugin success / fail-closed integration coverage、`DA-172` 与 resolved review。
- [x] TK-173 plugin-enabled distribution、clean-room、examples 与 release gate expansion
  - 2026-03-26：任务创建，状态初始化为 `planned`。
- 2026-03-26：状态切换为 `in_progress`，开始建立 plugin-enabled distribution、examples/runtime smoke、local verify 与 clean-room 的独立验证路径。
- 2026-03-26：任务完成，已建立 `build:plugin-enabled`、plugin-enabled examples/runtime smoke、plugin-enabled local/clean-room verify、`DA-173` 与 resolved review。
- [x] TK-174 sprint-003 出口验收与 sprint-004 service reuse 输入约束
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始汇总 sprint-003 的 optional plugin mode 证据链与 sprint-004 service reuse 输入约束。
  - 2026-03-26：任务完成，已产出 `DA-174`、resolved review，并形成 sprint-003 `accept` 结论与 sprint-004 shared loader/service reuse 输入约束。
