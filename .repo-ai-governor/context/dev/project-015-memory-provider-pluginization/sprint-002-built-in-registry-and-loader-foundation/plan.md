# sprint-002-built-in-registry-and-loader-foundation 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-015-memory-provider-pluginization`

## 1. Sprint Goal

建立 memory provider built-in registry 与 loader 基线，把 CLI 当前的 provider 选择逻辑从入口文件中抽离，并冻结 release/distribution 的最小模块化边界。

## 2. Task Package

1. `TK-167` memory provider registry package 与 built-in descriptor 契约基线（completed）
2. `TK-168` CLI memory provider loader cutover 与 legacy config 兼容（completed）
3. `TK-169` distribution 与 release 对 optional built-in provider 的边界收口（completed）
4. `TK-170` sprint-002 出口验收与 sprint-003 optional plugin 输入约束（completed）

## 3. Exit Criteria

1. 已形成 `built-in registry + loader` 的正式落点，不再把 provider 选择逻辑硬编码在 CLI 入口。
2. `fs-csv` 作为默认 built-in provider 的责任边界清晰，`sqlite-fs` 作为 optional built-in provider 仅保留 parser/selection compatibility；默认发行包必须显式 fail-closed。
3. release/build/distribution 已区分默认 built-in 与 optional provider 的最小支持矩阵。
4. sprint-002 的验收与 sprint-003 optional plugin 输入约束已形成正式基线。

## 4. Execution Notes

1. 本 sprint 只承接 Phase 1 `built-in registry`，不提前开放任意外部 provider module。
2. 外部 plugin 模式留给后续 sprint，需在安全与 allowlist 边界冻结后再进入实现。
