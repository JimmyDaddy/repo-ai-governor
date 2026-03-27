# sprint-001 HITL notification rehearsal evidence

- Status: completed
- Date: 2026-03-28
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-001-ga-blocker-notification-provider-implementation`

## 1. Scope

1. 验证 PRD §10.2 #8 所需的“1 主 1 备 HITL 通知渠道 rehearsal”。
2. 验证通知回执可写回审计事件与通知 artifact。
3. 记录本轮 GA blocker `GAP-NP` 的关闭证据。

## 2. Provider 拓扑

1. 主渠道：`webhook`
2. 备渠道：`chat-im`
3. CLI 真实 provider 发现使用环境变量：
   - `REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL`
   - `REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL`
   - 可选：`*_AUTH_TOKEN`、`*_HEADERS_JSON`、`*_TIMEOUT_MS`、`*_BACKOFF_BASE_MS`
4. 若未配置真实 provider，runtime 仍保留 deterministic artifact fallback，避免 HITL 流程失去本地可观测性。

## 3. Rehearsal 场景

### 3.1 webhook 主渠道送达

1. 使用 `apps/cli/test/cli-governance-runtime.integration.test.ts` 中的 `dispatches HITL notifications through configured webhook provider and records receipt metadata`。
2. 验证点：
   - 通知 artifact `channel` 为 `webhook`
   - `dispatchStatus` 为 `delivered_primary`
   - `attemptedChannels[0].providerMessageId` 为 `webhook-receipt-001`
   - 审计事件 `notificationChannel` 为 `webhook`
   - 审计事件 `notificationStatus` 为 `delivered_primary`
   - 审计事件 `notifiedAtDisplay` 为字符串时间戳

### 3.2 webhook 失败后降级到 chat-im

1. 使用 `apps/cli/test/cli-governance-runtime.integration.test.ts` 中的 `falls back to chat-im provider when webhook delivery fails`。
2. 验证点：
   - webhook 端点收到 2 次请求（含重试）
   - chat-im 端点收到 1 次请求
   - 通知 artifact `channel` 为 `chat_im`
   - `dispatchStatus` 为 `delivered_fallback`
   - `attemptedChannels[0].errorMessage` 包含 `HTTP 500`
   - `attemptedChannels[2].providerMessageId` 为 `chat-receipt-001`
   - 审计事件 `notificationChannel` 为 `chat_im`
   - 审计事件 `notificationStatus` 为 `delivered_fallback`

## 4. 审计字段确认

1. `notificationChannel`
2. `notificationStatus`
3. `notifiedAtDisplay`
4. `memoryDelta.attemptedChannels[*].providerMessageId`
5. provider receipt `metadata.statusCode`

## 5. 命令记录

1. `pnpm run typecheck`
2. `pnpm vitest run --config vitest.packages.config.ts packages/notification-dispatcher/test/notification-dispatcher.unit.test.ts packages/notification-providers/webhook/test/webhook-notification-provider.integration.test.ts packages/notification-providers/chat-im/test/chat-im-notification-provider.integration.test.ts`
3. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/runtime/notification-provider-registry-runtime.test.ts`
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 6. 结论

1. `packages/notification-providers/webhook/` 已满足主渠道 provider baseline。
2. `packages/notification-providers/chat-im/` 已提供主渠道失败时的自动降级路径。
3. HITL 通知 rehearsal 已验证“主送达 + 降级回退 + 审计回链”闭环。
4. PRD §10.2 #8 对应的 GA blocker `GAP-NP` 在 sprint-001 范围内已关闭。
