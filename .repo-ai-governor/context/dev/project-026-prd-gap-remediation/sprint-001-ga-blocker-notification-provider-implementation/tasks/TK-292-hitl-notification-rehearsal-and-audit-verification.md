# TK-292 HITL 1 主 1 备通知 rehearsal 与审计回链验证

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-001-ga-blocker-notification-provider-implementation`

## 1. 任务目标

完成 1 主 1 备 HITL 通知 rehearsal，验证通知回执写入审计事件，关闭 PRD §10.2 #8 GA 阻断。

## 2. Depends On

1. `TK-290`（webhook provider 已实装）
2. `TK-291`（备选 provider 已实装）

## 3. 预期产物

1. rehearsal 执行记录（结构化日志）
2. 审计事件中包含 `notification_channel`, `notification_status`, `notified_at_display`
3. 主渠道降级到备渠道的回退记录
4. `hitl-notification-rehearsal-evidence.md`

## 4. 实施计划

1. 构建 HITL rehearsal 场景：触发 `confirm` 或 `escalate`。
2. 验证 webhook 主渠道正常发送并返回回执。
3. 模拟主渠道失败，验证自动降级到备选渠道。
4. 确认审计事件中通知相关字段完整。
5. 输出 GA §10.2 #8 证据文档。

## 5. 验证命令

1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/runtime/notification-provider-registry-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始构建 webhook 主渠道 + chat-im 备渠道 rehearsal 场景并校验审计字段。
3. 2026-03-28：已完成主送达与降级回退两类 rehearsal、`notificationChannel` / `notificationStatus` / `notifiedAtDisplay` 审计验证，并沉淀 GA blocker 证据文档。
