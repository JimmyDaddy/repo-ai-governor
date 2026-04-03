# TK-487 roll codex onto shared invoke liveness watchdog graceful interrupt and partial output preservation

- Status: active
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P0
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-003-graceful-interrupt-cutover-and-governance-closeout`

## 1. 任务目标

收口 `Codex` 在 shared invoke-liveness runtime 上剩余的 watchdog、graceful interrupt、hard terminate、partial output preservation 与 reviewer 长任务保护链路，并为 `session.main / doctor / verify` 的正式 cutover 提供稳定输入。

## 2. Depends On

1. `TK-486`
2. `TK-488`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 3. 预期产物

1. Codex-first invoke watchdog baseline
2. `transport_idle_suspect / semantic_stall_suspect / graceful_interrupting / hard_terminating` 状态投影
3. graceful interrupt 与 hard-timeout fuse 的双阶段终止路径
4. partial output preservation 与 execution details 回看快照
5. reviewer 长任务与 direct-answer 的差异化 budget baseline

## 4. 实施计划

1. 在 `Codex` surface 上补齐 shared invoke-liveness 尚未 materialize 的 `transport_idle_suspect / semantic_stall_suspect / graceful_interrupting / hard_terminating` 状态投影。
2. 将 `Codex` adapter 的剩余固定 timeout / interrupt 路径迁入 shared state machine，并复用 `TK-488` 已验证的 CLI graceful interrupt 语义。
3. 在 suspect stall 后先进入 grace period，再执行 soft interrupt / hard terminate，并把 reason code / cancel mechanism 写回可消费快照。
4. 在终止前保留 latest assistant draft、reasoning/tool/todo 快照，并让 `session.main`、doctor/verify、shell/execution details 可见。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `codex adapter + session.main + interactive shell` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-03：经 project-037 sprint 台账复核，确认本任务未在 `sprint-001` 内完成闭环；shared baseline 已由 `TK-486` 与后续 rollout 吸收，但 Codex-specific watchdog/graceful-interrupt follow-through 仍需独立收口，因此任务迁移到 `sprint-003-graceful-interrupt-cutover-and-governance-closeout` 并保持 `planned`。
3. 2026-04-03：随着 `TK-489` 收口、`sprint-002` 完成，本任务被提升为新的 primary implementation surface；当前状态切换为 `active`，下一步将承接 Codex-specific watchdog / graceful interrupt / hard terminate closeout。
