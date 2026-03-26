# sprint-004-shared-loader-and-service-reuse 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-015-memory-provider-pluginization`

## 1. Sprint Goal

让 CLI、desktop host 与 service-backed runtime 进入同一条 memory provider shared loader / host surface 语义，补齐 service-host packaging 与 release gate，并完成 `project-015` 的闭项判断。

## 2. Task Package

1. `TK-175` memory provider shared loader contract 与 host surface baseline（completed）
2. `TK-176` CLI、desktop host 与 service-backed runtime 的 memory provider loader reuse cutover（completed）
3. `TK-177` service-host packaging、clean-room 与 release gate expansion for memory providers（completed）
4. `TK-178` sprint-004 出口验收与 project-015 completion assessment（completed）

## 3. Exit Criteria

1. `@repo-ai-governor/memory-provider-registry` 已成为 CLI、desktop host 与 service-backed runtime 共用的唯一 loader / registry seam。
2. `hostSurface` 与 `runtimeMode` 已形成正式 contract，且不再依赖调用方各自复制 provider resolution 逻辑。
3. service-host / desktop 相关的 plugin-enabled packaging、clean-room 与 release gate 已形成独立验证链路，不复用 CLI-only 结果代替。
4. `project-015` 已形成 completion audit 或明确的 residual blocker 结论。

## 4. Execution Notes

1. 本 sprint 只承接 `shared loader / service reuse`，不再扩大 plugin policy 范围。
2. 仍不得开放任意 module specifier；relative path / absolute path / `file:` URL 不进入本 sprint 实现。
3. service-host packaging 必须与 CLI default/plugin-enabled distribution 分离验证。
