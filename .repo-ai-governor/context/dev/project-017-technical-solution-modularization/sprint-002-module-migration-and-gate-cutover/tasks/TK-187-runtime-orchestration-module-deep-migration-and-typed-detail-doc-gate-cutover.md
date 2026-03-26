# TK-187 runtime.orchestration 模块深迁移与 typed detail-doc gate cutover

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-002-module-migration-and-gate-cutover`

## 1. 任务目标

深化 `runtime.orchestration` 模块文档，并让 module registry / docs triad / module graph gate 能区分 `contract` 与 `adr` 类型的 detail docs，完成 typed detail-doc cutover。

## 2. Depends On

1. `TK-184`
2. `TK-185`
3. `TK-186`
4. `DA-180`
5. `DA-181`
6. `DA-182`

## 3. 预期产物

1. 深化后的 `runtime.orchestration` overview/contract/adr。
2. typed detail-doc registry 解析与 gate cutover。
3. 对应测试与 `DA-187`。

## 4. 实施计划

1. 回收 project-016 的 graph-first execution 与 sidecar/service-backed host 事实。
2. 将 runtime.orchestration 文档从 skeleton 提升为可消费模块说明。
3. 扩展 registry parser、module graph gate 与 docs-triad gate，识别 `contract` / `adr` 差异。
4. 补齐集成测试，保证 ADR 变化不会误触 contract blocking 规则。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-docs-triad-sync.js`
3. `pnpm -s tsc -p tsconfig.json --noEmit`
4. `pnpm exec vitest run test/docs-triad-sync-gate.integration.test.ts test/technical-solution-module-graph-gate.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始迁移 `runtime.orchestration` rich docs 并改造 typed detail-doc registry/gates。
3. 2026-03-26：已完成 runtime.orchestration 模块深迁移、registry/gates/test cutover 与 `DA-187`，review 已直接收口为 resolved。
