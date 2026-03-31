# TK-453 implement service-owned session.main dispatcher and replace baseline ack

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint: `sprint-002-service-owned-session-main-dispatcher`

## 1. 任务目标

将 `session.main` 从当前 `baseline_ack` 升级为真实 service-owned dispatcher，使主 agent turn 至少能输出 structured handoff preview metadata，而不是只返回占位 ack。

## 2. Depends On

1. `TK-452`

## 3. 预期产物

1. service-owned `session.main` dispatcher
2. `sendSessionTurn()` structured completed payload
3. transcript store 对 structured handoff preview 的消费
4. service runtime 与 presenter 两侧的 targeted tests

## 4. 验证

1. `pnpm run build`
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：已新增 `LocalOrchestrationServiceSessionMainAgentDispatcher`，按 Path A 将 `session.main` turn 解析为 structured handoff preview / follow-up / answer 基线，并在 `TURN_STREAM_DELTA` 与 `TURN_COMPLETED` payload 中替换 `baseline_ack`。
3. 2026-03-31：`CliSessionShellTranscriptStore` 已补齐对 `command_handoff_preview` payload 的 presenter 渲染，并新增 core service + transcript store targeted tests。
