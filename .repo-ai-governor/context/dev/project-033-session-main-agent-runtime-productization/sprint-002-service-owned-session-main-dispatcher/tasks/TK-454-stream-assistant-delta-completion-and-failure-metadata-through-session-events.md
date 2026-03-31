# TK-454 stream assistant delta completion and failure metadata through session events

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint: `sprint-002-service-owned-session-main-dispatcher`

## 1. 任务目标

在 `TK-453` 的兼容式 dispatcher 基线之上，继续把 richer assistant delta/completed/failure/cancelled 语义补进 shared session event contract。

## 2. Depends On

1. `TK-453`

## 3. 预期产物

1. richer assistant delta payload semantics
2. `failed / cancelled` session event extension proposal or implementation
3. transcript / desktop consumer parity considerations
4. updated tests for error and cancellation lifecycle

## 4. 验证

1. `pnpm run build`
2. targeted Vitest covering session failure/cancellation path
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：已补齐 `TURN_FAILED / TURN_CANCELLED` shared session event types，并让 `session.main` dispatcher 在可控 failure/cancellation 场景下写入对应事件。
3. 2026-03-31：`CliSessionShellTranscriptStore` 已补齐对 failed/cancelled turn 的 presenter 渲染，并通过 build + targeted tests 验证。
