# @repo-ai-governor/core-session

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-015`

## Purpose

提供共享会话管理器基线，统一会话生命周期、上下文回写和事件追踪，并通过 `core-memory` 持久化状态。

## Baseline API

1. `SharedSessionManager`
   - `openSession(options?)`
   - `getSession(sessionId)`
   - `appendEvent(options)`
   - `updateContext(options)`
   - `finalizeSession(options)`
   - `listSessions(options?)`
2. `AuditRecorder`
   - `recordEvent(options)`
   - `listEvents(options)`
   - `exportEvents(options)`
   - `deleteEvents(options)`
   - `applyRetentionPolicy(options?)`
3. `SessionStatus`
   - `ACTIVE`
   - `COMPLETED`
   - `CANCELLED`
   - `FAILED`
4. `AuditRecordStatus`
   - `RUNNING`
   - `SUCCEEDED`
   - `FAILED`
   - `CANCELLED`

## Notes

1. Session 状态持久化在 `MemoryScope.SESSION` 下，`key=sessionId`。
2. 已关闭会话禁止继续 append/update，避免审计链路回写漂移。
3. 会话 payload 损坏会抛出标准化错误，便于定位存储与回放问题。
4. Audit 事件持久化在 `MemoryScope.EXECUTION` 下，`key=executionId:stageId:recordId`。
5. Audit 最小字段遵循 Stage 6 baseline，时间字段要求 RFC3339 秒级与展示时间双字段并存。
6. 隐私治理基线：默认保留周期 `90` 天，写入前执行敏感字段脱敏，并支持按 `execution_id/project/sprint/date range` 的导出与删除。
