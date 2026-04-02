# checklist

- [x] TK-477 implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 artifact registry / archive registry 的 sqlite truth 与 rendered CSV view 收口。
  - 2026-04-02：`TK-477` 已切换为 `active`；随 `sprint-002` 成为当前 primary planning surface，开始进入 artifact registry / archive registry sqlite canonical truth 的实施窗口。
  - 2026-04-02：已完成第一块包级基础实现：新增 `SqliteArtifactIndexStore`、main/archive lifecycle scope 常量与 2 条 sqlite canonical store 回归，为治理脚本切换到 canonical sqlite truth 做准备。
  - 2026-04-02：已完成治理脚本切换：`render/check/reconcile/compact` 统一改读 sqlite canonical truth，并通过 rendered CSV compatibility view 回写 `artifacts.csv / artifacts.archive.csv`。
  - 2026-04-02：新增 temp-workspace 级 canonical bootstrap/render 回归，且真实执行 `node ./scripts/governance/render-artifact-registry-view.js`、`check-artifact-registry-lifecycle.js`、`reconcile-artifact-dependencies.js --dry-run`、`compact-artifact-registry.js --dry-run` 全部通过。
  - 2026-04-02：`pnpm run check` 已通过，`TK-477` 收口为 `completed`。
  - 2026-04-02：已同步 artifact registry guide/index/governance/code standards 到 sqlite canonical truth 口径，并为 sqlite `-wal/-shm` 增加忽略规则；`check-artifact-registry-lifecycle`、task/sprint sync gate 与 `pnpm run check` 再次通过。
