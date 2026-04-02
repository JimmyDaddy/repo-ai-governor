# sprint-002-artifact-registry-sqlite-truth-and-rendered-views 计划

- Status: completed
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 将 Artifact Registry / Archive Registry 切为 sqlite canonical truth，并把 CSV 收口为 rendered compatibility/export view。

## 1. Task Package

1. `TK-477` implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views

## 2. Exit Criteria

1. Artifact Registry / Archive Registry 已具备 sqlite-backed canonical truth。
2. `artifacts.csv / artifacts.archive.csv` 已降级为 rendered compatibility/export view。
3. lifecycle gate、dependency resolution、render/reconcile 流程能直接读取 canonical registry。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-002`，冻结 `TK-477` 作为 artifact registry cutover implementation package。
2. 2026-04-02：`sprint-001-session-durable-storage-foundation` 已完成，`sprint-002` 被提升为当前 primary planning surface，承接 artifact registry / archive registry 的 sqlite canonical truth 与 rendered CSV compatibility cutover。
3. 2026-04-02：`TK-477` 已完成第一块基础实现，`packages/artifact-registry` 新增 sqlite-backed canonical store 基线，为后续 lifecycle gate/render/reconcile 脚本切换到 sqlite canonical truth 提供承载面。
4. 2026-04-02：artifact lifecycle render/check/reconcile/compact 脚本已切到 sqlite canonical truth，并以 `artifacts.csv / artifacts.archive.csv` 作为 rendered compatibility/export view 回写；脚本链 dry-run 与集成回归已通过。
5. 2026-04-02：`TK-477` 完成态验证通过，`sprint-002` exit criteria 全部满足，sprint 状态切换为 `completed`，后续主执行面前移到 `sprint-003-task-ledger-sqlite-projection-and-audit-read-model`。
6. 2026-04-02：artifact registry guide/index/lifecycle governance/code standards 已全部对齐到 sqlite canonical truth 语义，并补齐 sqlite `-wal/-shm` 忽略规则；`check-artifact-registry-lifecycle`、task/sprint sync gate 与 `pnpm run check` 复验通过。
