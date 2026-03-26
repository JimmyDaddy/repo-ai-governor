# TK-224 published surface inventory 与 packaged-runtime resolvability audit

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. 任务目标

盘点 root package、CLI 入口、exports/files/dist/runtime assets 的真实发布边界，并明确 packaged runtime resolvability 与 release gate gap map。

## 2. Depends On

1. `TK-223`
2. `DA-223`
3. `package.json`
4. `apps/cli/README.md`

## 3. 预期产物

1. published surface inventory。
2. packaged-runtime resolvability audit。
3. `sprint-002` 所需的 cutover edge map 与 release gate gap map。
4. `DA-224`

## 4. 实施计划

1. 盘点当前发布包对 `files / exports / dist / bin / runtime asset copy` 的真实依赖面。
2. 标记“workspace 内可用、发布包内不可用”的边界漂移点。
3. 将需要进入 blocking release gate 的 packaged runtime risk 收敛为有限集合。

## 5. 验证

1. `rg -n "exports|files|dist|asset|pack|clean-room|runtime" package.json apps/cli packages -g 'README.md' -g 'package.json'`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始盘点 pack manifest、build asset copy、published surface 与 verify-local-distribution 证据。
3. 2026-03-26：执行 `pnpm pack --json` 与 `node ./scripts/release/verify-local-distribution.js`，确认当前 tarball pack manifest 包含 `1275` 个文件，且 local distribution verification 通过。
4. 2026-03-26：确认根包的对外 contract 由 `bin.repo-ai-governor`、`exports["./service-host"]`、`exports["./package.json"]` 组成；运行时可解析性依赖 `dist/node_modules/@repo-ai-governor/*` snapshot 与 `dist/packages/published-surfaces/service-host.*` wrapper。
5. 2026-03-26：确认当前存在 3 个显式 truthfulness gap：README 引用的 `docs/local-adoption-playbook.md` 未被打包、`files` 声明 `skills` 但仓库实际是 `.codex/skills`、以及 tarball 仍依赖外部 registry 才能完成 offline 之外的安装。
6. 2026-03-26：形成 `DA-224`，将 packaged runtime resolvability、published surface inventory 与 release gate gap map 固化给 `TK-225` 消费。
