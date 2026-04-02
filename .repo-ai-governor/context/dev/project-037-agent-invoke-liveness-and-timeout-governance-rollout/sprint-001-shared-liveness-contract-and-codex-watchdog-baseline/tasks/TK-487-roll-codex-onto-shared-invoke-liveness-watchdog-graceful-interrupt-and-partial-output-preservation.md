# TK-487 roll codex onto shared invoke liveness watchdog graceful interrupt and partial output preservation

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. 任务目标

将 `Codex` invoke 路径切到 shared invoke-liveness runtime，并率先落地 watchdog、graceful interrupt、partial output preservation 与 reviewer 长任务保护。

## 2. Depends On

1. `TK-486`
2. `packages/adapters/codex/src/codex-agent-adapter.ts`
3. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 3. 预期产物

1. Codex-first invoke watchdog baseline
2. `transport_idle_suspect / semantic_stall_suspect / graceful_interrupting / hard_terminating` 状态投影
3. graceful interrupt 与 hard-timeout fuse 的双阶段终止路径
4. partial output preservation 与 execution details 回看快照
5. reviewer 长任务与 direct-answer 的差异化 budget baseline

## 4. 实施计划

1. 将 Codex adapter 的固定 timeout 逻辑迁移到 shared invoke-liveness state machine。
2. 区分真实 stdout/stderr / structured event 活动与 Governor 自己生成的 system heartbeat。
3. 在 suspect stall 后先进入 grace period，再执行 soft interrupt / hard terminate。
4. 在终止前保留 latest assistant draft、reasoning/tool/todo 快照，并让 shell/execution details 可见。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `codex adapter + session.main + interactive shell` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
