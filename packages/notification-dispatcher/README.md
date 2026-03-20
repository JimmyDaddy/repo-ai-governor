# @repo-ai-governor/notification-dispatcher

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-019`

## Purpose

提供 `NotificationDispatcher` 基线，实现 HITL 通知的主通道发送、失败重试、fallback 与升级通道兜底，并输出通知回执字段供审计链路复用。

## Baseline API

1. `NotificationDispatcher`
   - `dispatch(request)`
2. `NotificationChannel`
3. `NotificationDispatchStatus`
4. `NotificationRiskLevel`

## Notes

1. 仅当策略结果为 `confirm/escalate` 时触发通知分发。
2. 通知最小载荷覆盖 `executionId/stageId/routeKey/riskLevel/requiredAction/deadlineAt`。
3. 所有异常路径统一抛出标准化错误（`RuntimeError + GovernorErrorCode`）。
