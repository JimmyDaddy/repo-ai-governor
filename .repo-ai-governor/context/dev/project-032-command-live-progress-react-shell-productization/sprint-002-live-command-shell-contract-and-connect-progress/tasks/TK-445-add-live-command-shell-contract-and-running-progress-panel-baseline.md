# TK-445 add live command shell contract and running progress panel baseline

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-002-live-command-shell-contract-and-connect-progress`

## 1. 任务目标

在不破坏现有 final-result shell 的前提下，为 command-scoped React shell 增加 running-state panel、progress reducer/controller 与 `progressSink + abortSignal` runtime seam。

## 2. Depends On

1. `TK-444`

## 3. 预期产物

1. `cli-governance-runtime.interface.ts` 的 additive execution options seam
2. running progress panel view-model / controller / presenter baseline
3. targeted tests covering live command shell reduction and rerender

## 4. 验证

1. `pnpm run build`
2. targeted Vitest
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
