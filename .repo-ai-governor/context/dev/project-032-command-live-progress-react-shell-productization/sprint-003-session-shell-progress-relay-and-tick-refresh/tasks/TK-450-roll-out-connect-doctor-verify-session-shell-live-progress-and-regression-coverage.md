# TK-450 roll out connect doctor verify session-shell live progress and regression coverage

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-003-session-shell-progress-relay-and-tick-refresh`

## 1. 任务目标

将 `connect / doctor / verify` 接入 session-shell live progress consumer path，并补齐 direct CLI 与 nested session-shell path 的回归覆盖。

## 2. Depends On

1. `TK-449`

## 3. 预期产物

1. `connect / doctor / verify` session-shell live progress rollout
2. nested command regression coverage
3. no-extra-enter refresh evidence

## 4. 验证

1. `pnpm run build`
2. targeted Vitest covering connect doctor verify session-shell live progress
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：为 `CliDoctorCommand` 补齐 workspace baseline -> adapter verification -> diagnostics artifact 的 progress lifecycle，并新增 abort-aware cancelled status、shared diagnostics artifact patch 与最终 success snapshot，使 `doctor` 能被 session-shell running dock 与 nested `runCli(...)` 统一消费。
3. 2026-03-31：为 `CliVerifyCommand` 补齐 adapter verification -> diagnostics artifact 的 progress lifecycle，并在 required-role failure 路径下主动发出 final failure progress snapshot，再抛出原有 runtime error，避免失败时 panel 只停留在 running 状态。
4. 2026-03-31：新增 `doctor-command.test.ts`、`verify-command.test.ts` 与 `cli-output-contract.integration.test.ts` 中的 `doctor / verify` nested relay coverage，连同既有 session-shell runner / entrypoint / dock tests 一起验证 `connect / doctor / verify` 现已统一接入 session-shell live progress consumer path；同窗口 `pnpm run build` 通过。
