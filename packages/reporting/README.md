# @repo-ai-governor/reporting

- Status: baseline
- Date: 2026-03-21
- Scope: `project-005-observability-and-artifacts / TK-047`

## Purpose

提供 `ReportBuilder` 与 `ReplayExplainer` 基线，实现审计事件聚合报告、回放索引构建与 explain 输出。

## Baseline API

1. `ReportBuilder`
   - `buildExecutionReport(options)`
2. `ReplayExplainer`
   - `createSnapshot(options)`
   - `explain(options)`

## Notes

1. 报告输入默认消费 `core-session` 的 `AuditRecorder.listEvents` 契约，避免重复定义审计读取路径。
2. 回放索引按 `recordId/stageId/routeKey` 三个维度建立，便于后续 CLI 与审计导出链路复用。
3. explain 输出保持纯文本稳定结构，后续可被 `pretty/plain/json` 输出契约按模式渲染。
