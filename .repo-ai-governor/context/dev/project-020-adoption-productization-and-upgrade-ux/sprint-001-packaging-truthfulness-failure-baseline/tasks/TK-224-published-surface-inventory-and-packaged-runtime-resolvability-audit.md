# TK-224 published surface inventory 与 packaged-runtime resolvability audit

- Status: planned
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. 任务目标

盘点 root package、CLI 入口、exports/files/dist/runtime assets 的真实发布边界，并明确 packaged runtime resolvability 与 release gate gap map。

## 2. Depends On

1. `TK-223`
2. `package.json`
3. `apps/cli/README.md`

## 3. 预期产物

1. published surface inventory。
2. packaged-runtime resolvability audit。
3. `sprint-002` 所需的 cutover edge map 与 release gate gap map。

## 4. 实施计划

1. 盘点当前发布包对 `files / exports / dist / bin / runtime asset copy` 的真实依赖面。
2. 标记“workspace 内可用、发布包内不可用”的边界漂移点。
3. 将需要进入 blocking release gate 的 packaged runtime risk 收敛为有限集合。

## 5. 验证

1. `rg -n "exports|files|dist|asset|pack|clean-room|runtime" package.json apps/cli packages -g 'README.md' -g 'package.json'`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
