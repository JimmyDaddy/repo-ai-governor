# DA-150 LangGraph `run/review/HITL` 最小主链接线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-150`
- Produced By: `TK-150`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`apps/cli` 的 `run` 主链已正式切到 `ProcessRuntimeFacade`，并在 `LangGraph` 选中为 primary backend 时接通 `run -> review -> review-verify -> HITL -> recovery` 的第一轮最小闭环。

本轮交付固定了三件事：

1. CLI `run` 不再直接耦合底层 runtime engine，而是通过 facade 选择 `langgraph` 作为 primary backend。
2. `review -> review-verify -> HITL` 的既有 canonical source 回写继续保持不变。
3. `LangGraph` backend 现在会在主链完成后生成 file-backed checkpoint，并做 recovery smoke，向 CLI 暴露 checkpoint/recovery 正式状态。

## 2. 实现结果

1. facade 承接 CLI 主链执行入口
   - `CliGovernanceRuntime.executeRunCommand()` 现通过 `ProcessRuntimeFacade.execute()` 调度主链。
   - `runtime_backend` 默认固定为 `langgraph`。
   - 当前 CLI 正式输出面不再宣称 comparison backend 已在线执行。
2. facade 增加最小执行契约
   - `ProcessRuntimeFacade` 新增 `execute()`。
   - Phase 0 下，`langgraph` 选中后仍通过 shared deterministic runtime engine 承接 stage dispatch。
   - facade 负责统一 selection / prepared profile / execution result 的对外 contract。
3. checkpoint/recovery 接入 CLI 主链
   - `run` 完成后，当 primary backend 为 `langgraph` 时，CLI 会生成 file-backed checkpoint。
   - checkpoint 记录 `visitedNodeIds`、stage summary、可选 `pendingInterrupt` 与 artifact/task reference ids。
   - CLI 立即执行一次 recovery smoke，并把 `langgraph_checkpoint_path`、`langgraph_recovery_state`、`langgraph_pending_interrupt_kind` 暴露到正式输出面。
4. `review/HITL` canonical source 保持不漂移
   - inline review request / verify / ledger backfill 仍写入既有 review queue 与 ledger backfill 目录。
   - HITL notification / decision receipt 仍写入 `context/hitl/*`。
   - 本轮只新增 `langgraph_checkpoint` artifact，不改已有 review/audit/report 归档位置。

## 3. 代码边界冻结

### 3.1 本轮已实现

1. `packages/core-runtime/src/process-runtime-facade.ts`
2. `packages/core-runtime/src/types/interfaces/runtime-facade.interface.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/package.json`
5. `packages/core-runtime/test/process-runtime-facade.unit.test.ts`
6. `apps/cli/test/cli-governance-runtime.integration.test.ts`

### 3.2 本轮刻意不做

1. 不实现 native `LangGraph` stage scheduler
2. 不把 `sqlite-fs` provider 接到 checkpoint 主路径
3. 不引入 shared local orchestration service shell
4. 不把 parity harness 扩成 backend 内部日志/graph payload compare

这些工作保留给 `TK-151` 和 `TK-152`。

## 4. Phase 0 执行语义

1. `langgraph` 已是 facade 默认 primary backend。
2. Phase 0 的 stage dispatch 仍复用现有 deterministic runtime engine。
3. `LangGraph` 在本轮承担：
   - backend selection ownership
   - prepared execution contract
   - checkpoint/recovery ownership
   - CLI 正式输出面的 backend/recovery 语义
4. `review/HITL` 与 canonical source 回写仍由 CLI runtime 层负责。

## 5. 与 sprint-002 后续任务的关系

1. `TK-151` 直接消费本产物，将 file-backed checkpoint 升级到 `sqlite-fs`，并把主链能力收敛进 shared local orchestration service shell。
2. `TK-152` 需要把本产物作为 sprint-002 最小闭环已跑通的正式证据之一。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime/test/process-runtime-facade.unit.test.ts packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `pnpm run check`

## 7. 证据路径

1. `packages/core-runtime/src/process-runtime-facade.ts`
2. `packages/core-runtime/src/types/interfaces/runtime-facade.interface.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/package.json`
5. `packages/core-runtime/test/process-runtime-facade.unit.test.ts`
6. `apps/cli/test/cli-governance-runtime.integration.test.ts`
