# TK-482 implement layered adapter health check contract and shared probe runtime baseline

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

在 shared/runtime 层落地 `install / auth / protocol / semantic / route_capability` 分层 contract、稳定 reason code 与 probe orchestration baseline，替换现有“单布尔 OK 回声”健康判定模型。

## 2. Depends On

1. `TK-479`
2. `TK-481`

## 3. 预期产物

1. shared health-check result schema / type baseline
2. layer-specific status aggregation helper
3. stable reason-code taxonomy
4. route-capability probe orchestration seam
5. shared/unit 测试基线

## 4. 实施计划

1. 从当前 Phase A 宽松 `OK` 归一化 helper 提升到正式 layered contract。
2. 将 install/auth/protocol/semantic/route_capability 汇总为统一 result shape。
3. 为 route fallback 与 doctor/verify 提供稳定 reason-code 输入。
4. 补齐 shared/runtime 测试覆盖。

## 5. 验证

1. shared/runtime 定向单元测试
2. `pnpm run build`
3. `check-task-ledger-sync`
4. `check-sprint-plan-status-sync`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；承接 Phase B shared probe runtime baseline。
2. 2026-04-02：完成 layered health-check shared baseline：在 `adapter-sdk` 中新增 `install / auth / protocol / semantic / route_capability` 分层 contract、stable reason-code taxonomy 与 legacy-reason projection helper，并补齐 unit test；该 contract 已可被 adapter probe、CLI diagnostics 与 route consumer 统一消费，任务收口为 `completed`。
