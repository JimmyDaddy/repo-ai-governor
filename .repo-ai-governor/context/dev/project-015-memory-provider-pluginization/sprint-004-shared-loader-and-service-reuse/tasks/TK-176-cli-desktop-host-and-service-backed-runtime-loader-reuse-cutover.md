# TK-176 CLI、desktop host 与 service-backed runtime 的 memory provider loader reuse cutover

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-004-shared-loader-and-service-reuse`

## 1. 任务目标

将 CLI、desktop host 与 service-backed runtime 切到同一条 memory provider loader reuse seam，确保 provider 解析逻辑不再在 host 内复制。

## 2. Depends On

1. `TK-175`
2. `DA-174`

## 3. 预期产物

1. shared loader reuse cutover。
2. host-level integration baseline。

## 4. Required Inputs

1. `DA-172`
2. `DA-174`

## 5. Traceback References

1. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 让 CLI 与 service-backed runtime 显式消费同一条 memory provider registry / loader seam。
2. 明确 desktop host 的接入点与 hostSurface/runtimeMode 语义。
3. 补齐 integration coverage，验证 host 不再维护独立 provider resolution 逻辑。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始统一 embedded shell、sidecar client、desktop runtime 与 CLI diagnostics 的 loader reuse seam。
3. 2026-03-26：完成 CLI、desktop host 与 service-backed runtime 的 loader reuse cutover，host 不再复制 provider resolution 逻辑，产出 `DA-176`。
