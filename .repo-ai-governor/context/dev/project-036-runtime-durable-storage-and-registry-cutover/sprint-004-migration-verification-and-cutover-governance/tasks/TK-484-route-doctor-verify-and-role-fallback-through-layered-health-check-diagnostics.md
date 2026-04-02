# TK-484 route doctor verify and role fallback through layered health check diagnostics

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

将 `doctor`、`verify`、role routing 与 fallback 逻辑切换为消费 layered health-check diagnostics，使 surface 不可用、route 不满足、需要 fallback 或需要用户修复时都能给出结构化且可解释的结果。

## 2. Depends On

1. `TK-482`
2. `TK-483`

## 3. 预期产物

1. `doctor` layered diagnostics 输出
2. `verify` layered blocker / error code 收口
3. role routing / fallback 的 route-capability 决策切换
4. review/tester 场景的回归与超时/降级说明
5. CLI / session shell 用户可见诊断改进

## 4. 实施计划

1. 将 layered probe result 接入 doctor/verify presenter。
2. 将 surface_unavailable / fallback 逻辑从字符串判定切换为 reason-code 与 route-capability 语义。
3. 为 reviewer/tester 等 route 增加更明确的降级说明与 diagnostics artifact。
4. 补齐 CLI / routing / session shell 回归。

## 5. 验证

1. CLI / routing / session shell 定向回归
2. `pnpm run build`
3. `check-task-ledger-sync`
4. `check-sprint-plan-status-sync`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；承接 Phase D doctor/verify/route-consumer 切换。
