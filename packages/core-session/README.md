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
2. `SessionStatus`
   - `ACTIVE`
   - `COMPLETED`
   - `CANCELLED`
   - `FAILED`

## Notes

1. Session 状态持久化在 `MemoryScope.SESSION` 下，`key=sessionId`。
2. 已关闭会话禁止继续 append/update，避免审计链路回写漂移。
3. 会话 payload 损坏会抛出标准化错误，便于定位存储与回放问题。
