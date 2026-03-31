# TK-455 integrate session.main with adapter routing and session-level routing preference

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint: `sprint-003-intent-routing-and-command-handoff`

## 1. 任务目标

让 `session.main` 正式消费 session-level routing preference，并将 adapter-surface selection 语义回灌到 transcript 可见层，而不是只停留在后台 metadata。

## 2. Depends On

1. `TK-454`

## 3. 预期产物

1. dispatcher preference-aware surface selection
2. handoff preview 根据 preferred surface 变化
3. transcript routing selection summary
4. targeted tests covering preference path

## 4. 验证

1. `pnpm run build`
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：已让 `LocalOrchestrationServiceSessionMainAgentDispatcher` 解析 `sessionRoutingPreference`，并将其映射到 `selectedSurface / selectedBy / handoffCommandPreview`。
3. 2026-03-31：`CliSessionShellTranscriptStore` 已补齐 routing selection summary 渲染，并通过 build + targeted tests 验证。
