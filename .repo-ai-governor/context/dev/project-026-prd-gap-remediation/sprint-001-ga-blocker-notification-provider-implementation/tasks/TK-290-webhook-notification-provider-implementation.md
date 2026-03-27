# TK-290 webhook 通知 provider 实装与 dispatcher 接入

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-001-ga-blocker-notification-provider-implementation`

## 1. 任务目标

实装 `packages/notification-providers/webhook/` 作为主通知渠道 provider，并接入 `notification-dispatcher` 的 provider 契约。

## 2. Depends On

1. `TK-289`
2. `packages/notification-dispatcher/`

## 3. 预期产物

1. `packages/notification-providers/webhook/` 目录与 TypeScript 实装
2. webhook provider 实现 `NotificationProvider` 契约
3. dispatcher 通过 provider registry 可发现并调用 webhook provider
4. 单测覆盖 webhook 发送、重试、失败回退
5. 集成测试覆盖 dispatcher → webhook provider 的完整链路

## 4. 实施计划

1. 分析 `notification-dispatcher` 的 provider 契约接口。
2. 创建 `packages/notification-providers/webhook/` 包结构。
3. 实装 `WebhookNotificationProvider`：
   - HTTP POST 到配置的 webhook URL
   - 包含 HITL 通知最小载荷（`execution_id`, `stage_id`, `route_key`, `risk_level`, `required_action`, `deadline_at`）
   - 支持重试与指数退避
   - 支持自定义 headers 和 auth token
4. 将 webhook provider 注册到 dispatcher 的 provider registry。
5. 补齐单测和集成测试。

## 5. 验证命令

1. `pnpm run typecheck`
2. `pnpm vitest run --config vitest.packages.config.ts packages/notification-dispatcher/test/notification-dispatcher.unit.test.ts packages/notification-providers/webhook/test/webhook-notification-provider.integration.test.ts`
3. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/runtime/notification-provider-registry-runtime.test.ts`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始分析 `notification-dispatcher` provider 契约并搭建 webhook provider 包与 CLI provider 发现链路。
3. 2026-03-28：已完成 `packages/notification-providers/webhook/`、dispatcher provider registry 接入、CLI env-based provider discovery 与相关单测/集成测试。
