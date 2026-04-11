# checklist

- [x] TK-761 remove shell-owned preview-confirm default for governed session commands
  - 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“解释失败根因 + 移除默认 preview-confirm 冗余交互”。
  - 2026-04-11：已确认用户案例中的 `connect` 失败根因来自 `apps/cli/src/runtime/agent-onboarding-runtime.ts` 对 `sourceConfig.adapters` 的前置校验；当 source config 缺少 `adapters` baseline 时，runtime 会抛出 `ADAPTER_ROUTE_CONFIG_INVALID`。
  - 2026-04-11：已将 `connect`、`workspace switch-branch`、`run`、`workflow`、`plan sync` 的默认 handoff 模式收敛为 `direct_execute`，同时把 `/confirm`、`/cancel` 改为 hidden compatibility builtins，避免继续占据默认 discoverability 与快捷提示。
  - 2026-04-11：已同步 capability catalog、onboarding bundle、session shell 文案、runtime shell/orchestration 规范和 adoption playbook，并通过 targeted vitest 与 `pnpm run build`；当前任务状态切换为 `completed`。
- [x] TK-762 finalize project-080 closeout and completion audit
  - 2026-04-11：任务创建并在同一窗口直接推进到 `completed`，用于承接 `TK-761` clean 后的最终 closeout write-back。
  - 2026-04-11：已写入 `DA-762` 与 completion audit summary，并将 `project-080 / sprint-001` plan、`current-context.md` 与 `completed-streams-history.md` 同步到最终 `completed / idle` 真值。
  - 2026-04-11：已完成 `TK-761 / TK-762` canonical task-ledger sync，并复跑 targeted vitest、`pnpm run build` 与治理检查；当前项目已具备完整完成态证据。
