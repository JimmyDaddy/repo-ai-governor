# Code Review: TK-290~292 Notification Provider Working Tree

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `TK-290/TK-291/TK-292`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/**`
3. `.repo-ai-governor/draft/comprehensive-requirements-gap-analysis.md`
4. `.repo-ai-governor/draft/gap-remediation-execution-order.md`
5. `README.md`
6. `README.zh-CN.md`
7. `apps/cli/package.json`
8. `apps/cli/src/cli-governance-runtime.ts`
9. `apps/cli/src/constants/notification-provider.constant.ts`
10. `apps/cli/src/main.ts`
11. `apps/cli/src/runtime/hitl-runtime.ts`
12. `apps/cli/src/runtime/notification-provider-registry-runtime.ts`
13. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
14. `apps/cli/test/cli-governance-runtime.integration.test.ts`
15. `apps/cli/test/runtime/notification-provider-registry-runtime.test.ts`
16. `packages/notification-dispatcher/src/index.ts`
17. `packages/notification-dispatcher/src/notification-dispatcher.ts`
18. `packages/notification-dispatcher/src/notification-provider-registry.ts`
19. `packages/notification-dispatcher/src/types/interfaces/notification-dispatcher.interface.ts`
20. `packages/notification-dispatcher/test/notification-dispatcher.unit.test.ts`
21. `packages/notification-providers/chat-im/**`
22. `packages/notification-providers/webhook/**`
23. `scripts/build/copy-runtime-assets.js`
24. `scripts/release/verify-local-distribution.js`
25. `tsconfig.json`
26. `vitest.internal-alias.ts`

## 2. Findings
### 2.1 [P1] 默认 CLI 装配没有同步新的 provider 路由矩阵
- 位置: `apps/cli/src/main.ts:289`, `packages/notification-dispatcher/src/constants/notification-dispatcher.constant.ts:46`, `apps/cli/test/cli-governance-runtime.integration.test.ts:187`, `apps/cli/test/cli-governance-runtime.integration.test.ts:730`
- 问题描述: `main.ts` 只把 `notificationProviders` 注入运行时，没有给真实 CLI 路径注入与本次 GA blocker 一致的 `notificationPolicyMatrix`。因此生产路径仍会使用 dispatcher 默认矩阵：`medium/high` 首选 `chat_im`，`critical` 首选 `issue_system`。而本次实际注册的 provider 只有 `webhook`/`chat_im` 两类，`issue_system` 仍未实装。现有新增集成测试之所以全部通过，是因为它们显式注入了 `createWebhookPrimaryPolicyMatrixFixture()`，把四个 risk level 全部改成 `webhook -> chat_im`，没有覆盖默认 CLI 装配路径。
- 影响: 只配置 `REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL` 的真实部署下，中高风险 HITL 不会按文档和项目目标走 webhook 主渠道；`critical` 场景甚至会先命中不存在的 `issue_system`，最终把通知通道耗尽并中断运行。
- 建议: 在 `CliNotificationProviderRegistryRuntime` 或 `apps/cli/src/main.ts` 同步产出与已注册 provider 集合一致的 policy matrix，至少保证当前 GA 路径是 `webhook` 主、`chat_im` 备；同时补一条“不传自定义 matrix”的 CLI 集成测试覆盖默认环境装配。

### 2.2 [P1] 全渠道失败时不会留下本地 notification artifact / audit evidence
- 位置: `apps/cli/src/runtime/hitl-runtime.ts:187`, `apps/cli/src/runtime/hitl-runtime.ts:196`, `apps/cli/src/runtime/hitl-runtime.ts:208`, `apps/cli/src/runtime/hitl-runtime.ts:309`
- 问题描述: 一旦配置了外部 provider，`resolveNotificationProviders()` 就会移除本地 artifact provider，只保留外部渠道。新的 `writeNotificationArtifact()` 又是在 `notificationDispatcher.dispatch()` 成功返回之后才执行；但 `dispatch()` 在 primary/fallback/escalation 全部失败时会直接抛错。这样一来，最需要调试和审计证据的失败路径会在写入本地 `.notification.json` 和 audit event 之前中断，等于把原来的确定性本地兜底一起删掉了。
- 影响: 当 webhook/chat-im 配置错误、网络故障、或默认矩阵命中未实现渠道时，CLI 会既丢通知又丢本地证据，无法满足当前 sprint 明确要求的 rehearsal / audit evidence，也会让故障排查和复盘缺乏最基本的落盘记录。
- 建议: 保留本地 artifact provider 作为外部渠道之后的确定性兜底，或在 `dispatch()` 抛错时先持久化失败态 artifact / audit record 再向上抛出异常。

## 3. Notes
1. `pnpm run typecheck`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js` 与通知相关定向 Vitest 都已通过。
2. 当前测试覆盖了自定义 `notificationPolicyMatrix` 的 happy path / fallback path，但没有覆盖 CLI 默认环境装配路径；这正是第一个问题漏出的原因。
3. 其余工作树改动（台账、README、provider 包装配、打包脚本、别名映射）未看到比以上两点更高优先级的阻断问题。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `pnpm exec vitest run apps/cli/test/runtime/notification-provider-registry-runtime.test.ts packages/notification-dispatcher/test/notification-dispatcher.unit.test.ts packages/notification-providers/webhook/test/webhook-notification-provider.integration.test.ts packages/notification-providers/chat-im/test/chat-im-notification-provider.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-03-28）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] 默认 CLI 装配没有同步新的 provider 路由矩阵`
   - 判定：**认可**
   - 证据：当前 `apps/cli/src/runtime/hitl-runtime.ts` 已在运行时根据已注册 provider 自动派生默认 `notificationPolicyMatrix`，不再依赖 dispatcher 的仓库级静态默认矩阵；新增高风险 webhook-only 场景验证默认装配走 `webhook` 主渠道。
   - 处理：已接受并修复，改为在无显式 matrix 时按 runtime provider 集合对齐默认路由。
2. `2.2 [P1] 全渠道失败时不会留下本地 notification artifact / audit evidence`
   - 判定：**认可**
   - 证据：当前 `apps/cli/src/runtime/hitl-runtime.ts` 会捕获 `NOTIFICATION_DISPATCH_FAILED`，先生成 failed `NotificationDispatchResult`，再写入 `.notification.json` 与 `stage-hitl-notification` 审计事件；新增双渠道全部失败测试已覆盖该路径。
   - 处理：已接受并修复，失败态 now 保留本地 artifact/audit 证据，同时继续按策略中断执行。

### 验证命令
1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-03-28）

1. `2.1 [P1] 默认 CLI 装配没有同步新的 provider 路由矩阵`：已完成
   - 变更文件：`apps/cli/src/runtime/hitl-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1` && `pnpm run typecheck` && `pnpm run check`（通过）
   - 说明：无显式 matrix 时改为从当前 runtime provider 集合派生默认路由，保证 webhook-only / webhook+chat-im 都沿当前 sprint 的主备策略执行。
2. `2.2 [P1] 全渠道失败时不会留下本地 notification artifact / audit evidence`：已完成
   - 变更文件：`apps/cli/src/runtime/hitl-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1` && `node ./scripts/governance/check-code-review-status-sync.js` && `pnpm run check`（通过）
   - 说明：通知分发耗尽时先落盘 failed notification artifact / audit evidence，再继续抛出策略中断结果，避免最关键失败路径失去诊断证据。
