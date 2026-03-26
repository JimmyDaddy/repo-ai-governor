# TK-185 governance.spec-sync 模块深迁移与 ADR 切口收敛

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-002-module-migration-and-gate-cutover`

## 1. 任务目标

把 `governance.spec-sync` 从 skeleton baseline 深化为正式模块文档，补齐 triad/brief/module impact escalation 语义、ADR 切口与 direct consumer 指导。

## 2. Depends On

1. `TK-184`
2. `DA-180`
3. `DA-181`
4. `DA-182`

## 3. 预期产物

1. `governance.spec-sync` 的 rich module overview。
2. 相关 ADR 文档。
3. `DA-185`

## 4. 实施计划

1. 回收 project-003 的 Spec Sync gate integration 事实。
2. 将 triad / brief / module impact escalation 规则迁入模块文档。
3. 为 ADR 切口定义非 contract 级 detail doc 边界。
4. 确保 registry/gate 可识别对应 detail doc 类型。

## 5. 验证

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-technical-solution-module-graph.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始迁移 `governance.spec-sync` rich docs 与 ADR 切口。
3. 2026-03-26：已完成 overview/contract/adr 深迁移与 typed detail-doc 语义落盘，形成 `DA-185`，review 已直接收口为 resolved。
