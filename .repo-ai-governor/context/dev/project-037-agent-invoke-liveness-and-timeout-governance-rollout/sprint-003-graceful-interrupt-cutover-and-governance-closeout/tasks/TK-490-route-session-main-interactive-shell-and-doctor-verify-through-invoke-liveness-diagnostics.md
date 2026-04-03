# TK-490 route session-main interactive shell and doctor verify through invoke liveness diagnostics

- Status: completed
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P0
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-003-graceful-interrupt-cutover-and-governance-closeout`

## 1. 任务目标

让 `session.main`、interactive shell、execution details、`doctor` 与 `verify` 正式消费 shared invoke-liveness projection，并稳定解释等待、中断与 fail-closed 原因。

## 2. Depends On

1. `TK-487`
2. `TK-488`
3. `TK-489`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-turn-progress-dock.ts`

## 3. 预期产物

1. session-main invoke-liveness diagnostics
2. interactive shell / execution details invoke-liveness presentation
3. doctor / verify invoke-liveness structured diagnostics
4. partial-output preservation 展示与 failure explanation baseline
5. route / role / surface 预算可观察性

## 4. 实施计划

1. 将 invoke-liveness 快照接入 session-main role dispatch 与 direct-answer execution path。
2. 让 interactive shell 与 execution details 呈现 suspect stall、graceful interrupt、hard terminate 与 partial-output preserved。
3. 将 doctor/verify 扩展为可解释 invoke-liveness state、reason code、budget 分类与最近事件快照。
4. 补齐 session shell、CLI runtime 与 diagnostics artifact 定向回归。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `session.main + interactive shell + doctor/verify` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-03：任务切换为 `active`，开始接线 `session.main` / interactive shell / doctor / verify 对 shared invoke-liveness diagnostics 的正式消费。
3. 2026-04-03：完成 `session.main` live invoke-liveness shell 呈现、execution details 细化，以及 `doctor/verify` 的 invoke-liveness structured diagnostics 投影；定向 `vitest`、`check-i18n-parity-fallback`、ledger gates 与 `pnpm run build` 全部通过，任务切换为 `completed`。
