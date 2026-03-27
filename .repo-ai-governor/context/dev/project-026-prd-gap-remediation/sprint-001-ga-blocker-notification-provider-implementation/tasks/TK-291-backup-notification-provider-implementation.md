# TK-291 备选通知渠道 provider (email 或 chat-im) 实装

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-001-ga-blocker-notification-provider-implementation`

## 1. 任务目标

实装至少 1 个备选渠道 provider，作为主渠道（webhook）失败时的降级路径。

## 2. Depends On

1. `TK-290`（webhook provider 已实装，可复用 provider 契约模式）

## 3. 预期产物

1. `packages/notification-providers/chat-im/`
2. 备选 provider 实现 `NotificationProvider` 契约
3. dispatcher 可在主渠道失败时自动降级到备选渠道
4. 单测覆盖

## 4. 实施计划

1. 基于 webhook provider 同样的契约接口，实装 chat-im provider。
2. 配置 dispatcher 的渠道优先级策略：主 webhook → 备 chat-im。
3. 验证降级路径。

## 5. 验证命令

1. `pnpm run typecheck`
2. `pnpm vitest run --config vitest.packages.config.ts packages/notification-providers/chat-im/test/chat-im-notification-provider.integration.test.ts packages/notification-dispatcher/test/notification-dispatcher.unit.test.ts`
3. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-governance-runtime.integration.test.ts`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始实装 chat-im fallback provider 并接入 dispatcher fallback policy matrix。
3. 2026-03-28：已完成 `packages/notification-providers/chat-im/`、主 webhook 失败后的自动降级路径，以及 provider 回执 metadata 覆盖。
