# checklist

- [x] TK-885 integrate connect doctor verify readiness composition for acp_exec and host next-actions
  - 2026-04-14：任务创建，状态初始化为 `planned`。
  - 2026-04-15：`sprint-001` clean closeout 完成后，当前任务切换为 `in_progress`，并作为 `project-105 / sprint-002` 的 implementation 入口；下一步先本地预留 `CR-001`，再开始 ACP readiness composition 与 host next-actions implementation。
  - 2026-04-15：已把 ACP host companion/evidence runtime 接到 `connect / doctor / verify` readiness composition，`enabled_tools[] / tool_transport_matrix / verify matrix / diagnostics artifact` 现在都会稳定投影 `acp_host_companion`，`diagnostic_summary` 也会机械带出 ACP runtime/distribution readiness 计数。当前实现边界完成，进入 `CR-001` fresh reviewer loop。
- [x] TK-886 enable packaged-distribution and runtime-service surfaces behind explicit ACP boundaries
  - 2026-04-14：任务创建，状态初始化为 `planned`。
  - 2026-04-15：已将 packaged-distribution 与 runtime-service evidence 显式收口在 ACP-only boundary。`CliAcpHostProtocol` 现在会读取 host verification summaries 并把 `runtime_service_ready / packaged_distribution_ready` diagnostics 投影到 ACP companion，同时 `CliAdapterVerificationRuntime` 会输出 ACP-specific next-actions，而不会把这些 enablement surfaces 误写成 `cli_exec` 成功路径。当前任务实现完成，进入 `CR-001` fresh reviewer loop。
- [x] TK-887 sprint-002 exit acceptance and sprint-003 activation handoff
  - 2026-04-14：任务创建，状态初始化为 `planned`。
  - 2026-04-15：`CR-001` 修复 round 与 `CR-002` clean recheck 已全部收口，当前 sprint-002 boundary 内无剩余 actionable finding。已完成 sprint-002 exit acceptance，并将 `sprint-003` 激活为新的 primary stream；`TK-888` 切换为 `in_progress`，下一步先在新 sprint 本地预留 `CR-001` 再开始 clean-room verify implementation。
- [x] CR-001 sprint-002-distribution-and-runtime-service-enablement delegated review loop round 1
  - 2026-04-15：任务创建，状态初始化为 `review_pending`。
  - 2026-04-15：sprint-002 implementation boundary 已完成，当前 ACP rollout 会基于 host verification evidence 投影 runtime-service / packaged-distribution readiness，并将 ACP-specific next-actions 暴露到 `connect / doctor / verify` companion artifacts 中。定向 runtime tests、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已通过，下一步发起 fresh reviewer round。
  - 2026-04-15：fresh reviewer round 1 返回 1 条被认可的 P1 finding，指出 ACP evidence search root 错把 repo-local `workspaceRoot` 当作 repo root 使用。main agent 已复核并接受该问题，当前将 `CR-001` 推进到 `verified`，下一步补写修复记录并收口到 `resolved`。
  - 2026-04-15：已将 ACP evidence search root 改为 repo/current-working-directory 语义，并把 routing regression fixture 调整到真实 repo-local `workspaceRoot` 布局。focused vitest、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 复验通过，当前 round 已收口为 `resolved`。
- [x] CR-002 sprint-002-distribution-and-runtime-service-enablement delegated review loop round 2
  - 2026-04-15：任务创建，状态初始化为 `review_pending`。
  - 2026-04-15：fresh reviewer round 2 返回 clean 结论；main agent 复核后确认 sprint-002 当前 boundary 内无剩余 actionable finding，`CR-002` 直接收口为 `resolved`。
