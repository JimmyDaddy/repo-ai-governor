# sprint-002-connect-selection-ux-and-candidate-materialization 计划

- Status: completed
- Date: 2026-04-09
- Project: `project-076-transport-selection-authority-rollout`
- Sprint Goal: 为 `connect` 增加显式 transport 选择 UX，并保证 candidate config / diagnostics 稳定 materialize user-selected transport。

## 1. Task Package

1. `TK-729` add per-tool transport selection flags to connect
2. `TK-730` materialize explicit transport in candidate config and validate unsupported combinations
3. `TK-731` project transport selection source and lock state across connect-doctor-verify outputs
4. `TK-736` sprint-002 exit acceptance and sprint-003 activation handoff

## 2. Exit Criteria

1. `connect` 能为单个 tool 显式 author `transport`。
2. candidate config 会稳定 materialize user-selected transport 与 required remoteApi truth。
3. `connect / doctor / verify` 输出能区分 `config_explicit`、`inferred_from_remote_api` 与 `surface_default`。

## 3. Milestones

1. 2026-04-09：作为 `project-076` 的第二阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-09：`TK-735 / DA-735` 完成 sprint-001 closeout 后，`sprint-002` 被激活为当前 primary sprint，`TK-729` 已切换为 `in_progress`。
3. 2026-04-10：`TK-729`、`TK-730`、`TK-731` 已完成 connect transport authoring、candidate materialization 与 projection/output truth 对齐；当前进入 sprint-scoped CR loop。
4. 2026-04-10：`CR-002` finding 已完成修复，`CR-003` fresh delegated reviewer recheck 返回 clean verdict；`TK-736 / DA-736` 已完成 sprint-002 closeout，并激活 `sprint-003`。
