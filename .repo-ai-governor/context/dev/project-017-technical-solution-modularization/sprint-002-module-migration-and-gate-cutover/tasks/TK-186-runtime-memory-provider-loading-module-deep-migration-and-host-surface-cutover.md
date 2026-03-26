# TK-186 runtime.memory-provider-loading 模块深迁移与 host surface cutover 文档化

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-002-module-migration-and-gate-cutover`

## 1. 任务目标

把 `runtime.memory-provider-loading` 模块文档深化为可复用的 host-surface / runtime-mode / shared loader cutover 说明，并补齐 ADR 级迁移锚点。

## 2. Depends On

1. `TK-184`
2. `DA-180`
3. `DA-181`
4. `DA-182`

## 3. 预期产物

1. 深化后的 `runtime.memory-provider-loading` overview/contract。
2. host surface cutover ADR。
3. `DA-186`

## 4. 实施计划

1. 回收 project-015 的 shared loader 与 host surface baseline。
2. 把 CLI / desktop / service-backed runtime 共用 seam 迁入模块文档。
3. 明确 contract 与 ADR 的职责边界。
4. 同步 registry / manifest / gate 所需元数据。

## 5. 验证

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-technical-solution-module-graph.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始迁移 `runtime.memory-provider-loading` rich docs 与 host surface cutover 说明。
3. 2026-03-26：已完成 memory provider loading 模块深迁移、ADR 文档化与 manifest/registry 同步，形成 `DA-186`，review 已直接收口为 resolved。
