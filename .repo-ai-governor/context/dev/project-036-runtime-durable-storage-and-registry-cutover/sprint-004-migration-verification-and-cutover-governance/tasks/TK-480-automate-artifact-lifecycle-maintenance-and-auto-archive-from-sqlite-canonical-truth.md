# TK-480 automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

基于 artifact registry sqlite canonical truth，将当前批处理式 `reconcile + compact + render` 收敛为更稳定的自动维护链路，使 artifact lifecycle 能按状态机语义自动完成 `dependent_tasks` 清理、`deprecated` 标记与 `archived` 迁移，并保留 rendered CSV compatibility/export view。

## 2. Depends On

1. `TK-477`

## 3. 预期产物

1. artifact lifecycle 的自动维护编排与触发策略
2. sqlite canonical truth 上的 auto-deprecate / auto-archive 事务语义
3. canonical sqlite -> rendered CSV view 的自动 render 闭环
4. artifact lifecycle automation 的 audit / gate / rollback 验证基线

## 4. 实施计划

1. 将 artifact lifecycle 从“脚本批处理”提升为稳定自动维护流水线，明确触发时机、apply/dry-run 语义与失败回退边界。
2. 基于 sqlite canonical truth 实现 `active/frozen -> deprecated -> archived` 的自动迁移判定，并把 `dependent_tasks` 清理与状态迁移收敛到同一事务边界。
3. 为 auto-maintenance 增加 audit trace、batch summary 与 rendered CSV compatibility view 自动刷新。
4. 补齐 artifact lifecycle automation 的定向测试、doctor/verify/gate 与 adoption evidence。

## 5. 验证

1. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
2. `pnpm run artifacts:compact -- --dry-run`
3. `pnpm run build`
4. artifact lifecycle automation / render / compact / reconcile 相关定向测试与 smoke

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；承接 artifact registry sqlite canonical truth 后续的自动维护与 auto-archive 能力建设。
