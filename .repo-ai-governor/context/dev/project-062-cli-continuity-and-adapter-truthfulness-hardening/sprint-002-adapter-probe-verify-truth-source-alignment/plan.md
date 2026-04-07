# sprint-002-adapter-probe-verify-truth-source-alignment 计划

- Status: active
- Date: 2026-04-08
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint Goal: 收敛 `connect / doctor / verify / transcript` 对 adapter readiness 的真值来源与对外表达。

## 1. Task Package

1. `TK-664` freeze connect doctor verify transcript truth-source contract
2. `TK-665` implement adapter probe outcome classification and presenter-safe diagnostics alignment
3. `TK-666` close CLI truthfulness hardening with cross-adapter evidence refresh

## 2. Exit Criteria

1. connect/doctor/verify/transcript 共享同一 truth-source contract。
2. adapter probe outcome classification 不再把“本机可用但探测失败”与 auth/quota/transport fallback 混写。
3. 至少一轮 cross-adapter evidence refresh 与 build evidence 可支撑 project closeout。

## 3. 里程碑记录

1. 2026-04-08：作为 `project-062` follow-up sprint 创建，初始状态为 `planned`。
2. 2026-04-08：`TK-697 / DA-697` 完成 `sprint-001` closeout 后，当前 sprint 已被激活为 primary stream，`TK-664` 切换为 `in_progress`。
