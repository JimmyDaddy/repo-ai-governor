# TK-446 instrument connect with progress events and cancellable running shell baseline

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-002-live-command-shell-contract-and-connect-progress`

## 1. 任务目标

让 `connect` 成为第一条 live running shell consumer，发出结构化 progress events，并完成至少一版 `AbortSignal` cancel seam 的 baseline。

## 2. Depends On

1. `TK-445`

## 3. 预期产物

1. `connect-command.ts` progress events
2. live running shell initial consumer path
3. connect-focused smoke/integration evidence

## 4. 验证

1. `pnpm run build`
2. targeted Vitest + connect integration tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
