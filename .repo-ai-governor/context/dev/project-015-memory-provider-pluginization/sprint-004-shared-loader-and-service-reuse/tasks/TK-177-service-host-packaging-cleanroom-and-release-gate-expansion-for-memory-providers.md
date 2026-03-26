# TK-177 service-host packaging、clean-room 与 release gate expansion for memory providers

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-004-shared-loader-and-service-reuse`

## 1. 任务目标

建立 service-host / desktop 维度的 memory provider packaging、clean-room 与 release gate，确保 service reuse 不复用 CLI-only distribution 结果代替。

## 2. Depends On

1. `TK-175`
2. `TK-176`
3. `DA-174`

## 3. 预期产物

1. service-host packaging baseline。
2. service-host clean-room / release gate baseline。

## 4. Required Inputs

1. `DA-173`
2. `DA-174`

## 5. Traceback References

1. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 区分 CLI distribution 与 service-host / desktop 维度的 plugin-enabled packaging。
2. 为 service-host 引入独立 clean-room / smoke / release gate 验证路径。
3. 冻结 service-host packaging 的责任边界与 fail-closed 语义。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始扩展 desktop/service-host 维度的 local distribution、clean-room 与 release gate。
3. 2026-03-26：完成 service-host packaging、desktop smoke 与 installed-package clean-room 验证扩展，default/plugin-enabled 两条链路均可独立验证，产出 `DA-177`。
