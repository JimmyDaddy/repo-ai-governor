# TK-511 project presenter-safe continuation summaries into session.main transcript and resume consumers

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint: `sprint-002-summary-projection-and-provider-readiness-governance`

## 1. 任务目标

把 lane-scoped continuation truth 投影为 presenter-safe summary，供 `session.main`、CLI transcript、resume 与后续 desktop consumer 消费；consumer 只知道 reuse/invalidation 结果与摘要原因，不持有 raw provider handle。

## 2. Depends On

1. `TK-509`
2. `TK-510`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`

## 3. 预期产物

1. turn-level presenter-safe continuation summary contract
2. CLI transcript / resume consumer projection baseline
3. raw handle redaction boundary
4. future desktop-compatible summary seam

## 4. 实施计划

1. 在 orchestration turn/execution truth 中补 continuation summary，而不是直接把 slot map 暴露给 presenter。
2. 让 CLI transcript、resume 与 diagnostics 只消费 summary 结果、reason 与 lane-scoped reuse outcome。
3. 确保 raw provider handle、provider-private metadata 与 slot owner state 继续留在 runtime/service seam。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `apps/cli / core-orchestration-service` 相关定向测试集合

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；等待 `sprint-001` 完成 slot lifecycle 与 Codex remote baseline 后执行。
2. 2026-04-04：任务完成：`TURN_COMPLETED.payload.providerContinuationSummaries`、CLI transcript store、transcript pane 与 i18n key 已全部落地，consumer 仅暴露 presenter-safe summary block，不泄露 raw provider handle。
3. 2026-04-04：CR 修复追加收口：`unsupported` continuation 现在即便没有旧 slot 也会保留 presenter-safe summary，并已补齐 CLI transcript 渲染与中英文 locale key，避免 stateless fallback 被静默吞掉。
