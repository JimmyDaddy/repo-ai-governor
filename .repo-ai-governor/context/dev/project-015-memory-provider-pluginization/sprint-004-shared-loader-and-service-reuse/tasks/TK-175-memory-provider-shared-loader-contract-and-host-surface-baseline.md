# TK-175 memory provider shared loader contract 与 host surface baseline

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-004-shared-loader-and-service-reuse`

## 1. 任务目标

冻结 CLI、desktop host 与 service-backed runtime 共用的 memory provider shared loader、`hostSurface` 与 `runtimeMode` 契约，避免各 host 再复制一套 provider resolution 规则。

## 2. Depends On

1. `TK-174`
2. `DA-174`

## 3. 预期产物

1. shared loader / host surface baseline。
2. service reuse contract baseline。

## 4. Required Inputs

1. `DA-171`
2. `DA-172`
3. `DA-174`

## 5. Traceback References

1. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 收敛 `memory-provider-registry` 的 shared loader / host surface / runtime mode 输入契约。
2. 明确 CLI、desktop host 与 service-backed runtime 对同一条 registry seam 的依赖关系。
3. 冻结 service reuse 进入条件与 fail-closed 规则。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始收敛 CLI、desktop host 与 service-backed runtime 共用的 shared loader / host surface / runtime mode 契约。
3. 2026-03-26：完成 shared loader / host surface baseline，`memory-provider-registry` 已输出正式 composition summary，service-backed runtime 已通过 service-owned `memoryProvider` DTO 回传该状态，产出 `DA-175`。
