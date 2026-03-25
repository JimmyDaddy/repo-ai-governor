# DA-156 CLI `run/review/HITL/recovery` 到 orchestration-service-client 的 cutover

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-156`
- Produced By: `TK-156`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`TK-156` 将 `apps/cli` 的 `run/review/review-verify` 主路径正式收敛到 service-backed execution 边界。CLI 不再直接 new 或持有 `LocalOrchestrationServiceShell`，而是通过 package-local `CliOrchestrationServiceRuntime` 消费 `orchestration-service-client` 的 execution surface，并把 runtime owner 的 shell-only 写操作限制在单一 runtime seam 内。

本轮固定了 4 件事：

1. `run` 不再直接依赖 `LocalOrchestrationServiceShell`，而是通过 `CliOrchestrationServiceRuntime` 使用 shared local orchestration service。
2. `review` 与 `review-verify` 现在会创建独立的 service-backed execution，并把 request/verify/backfill 产物回链到 orchestration event stream。
3. HITL 决策与 recovery 状态开始通过 service client surface 回写 execution summary，而不是只停留在 CLI 本地 artifact/audit。
4. CLI 正式输出新增稳定的 orchestration details，使未来 desktop/daemon transport parity 可以直接复用同一 execution summary / stream token / cursor 语义。

## 2. 实现结果

### 2.1 package-local orchestration runtime seam

1. 新增 `apps/cli/src/runtime/orchestration-service-runtime.ts`
   - 懒加载 embedded `LocalOrchestrationServiceShell`。
   - 将 `start/get/list/subscribe/submitHitlDecision/recover` 与 runtime-owner `publishEvent/saveCheckpoint` 收敛到单一 package-local seam。
2. `CliGovernanceRuntime`
   - 不再直接 import/new `LocalOrchestrationServiceShell`。
   - `captureLangGraphCheckpointState()` 改为经 service runtime 落 checkpoint，并在非终态 execution 上消费 `recoverExecution()` contract。

### 2.2 `run` 路径的 client cutover

1. `run` 主链继续由 CLI 持有 canonical source 回写，但 execution owner 信息改由 service runtime 持有。
2. HITL 进入决策阶段后：
   - CLI 仍写 canonical notification / decision receipt artifact。
   - service 通过 `submitHitlDecision()` 消费相同 receipt backlink，并更新 execution summary/status。
3. recovery 结果改由 service summary / recovery response 驱动，终态 execution 不再误触发 recover。

### 2.3 `review/review-verify` 路径的 service-backed execution

1. `review`
   - 现在会创建 `executionKind=review` 的 service-backed execution。
   - request artifact 会回链到 event stream，并在 command result details 中暴露 orchestration execution metadata。
2. `review-verify`
   - 现在会创建 `executionKind=review_verify` 的 service-backed execution。
   - verify/backfill artifact 会回链到 service event stream。
   - managed ledger backfill 失败时会显式将 service execution 标记为 failed。

## 3. 代码边界结论

1. `CliGovernanceRuntime` 保持 facade 角色，不再直接持有 `LocalOrchestrationServiceShell` 类型。
2. `LocalOrchestrationServiceShell` 仍是 embedded owner，但 shell-only 方法只允许通过 `CliOrchestrationServiceRuntime` 使用。
3. `orchestration-service-client` contract 本轮补充了：
   - `review` / `review_verify` execution kind
   - `submitHitlDecision` 对 caller-provided receipt backlink 的兼容

## 4. 与后续任务的关系

1. `TK-157` 可以基于这轮 cutover，正式比较 CLI facade 对外产物与 service-backed execution path 的 parity。
2. `TK-158` 的 sprint/project 验收草案可以将 exit criteria 3 从“被 TK-156 阻塞”更新为“已满足 client cutover 前提，待 TK-157 完成 parity 结论”。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
7. `pnpm run check`

## 6. 证据路径

1. `apps/cli/src/runtime/orchestration-service-runtime.ts`
2. `apps/cli/src/cli-governance-runtime.ts`
3. `apps/cli/src/commands/review-command.ts`
4. `apps/cli/src/commands/review-verify-command.ts`
5. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
6. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
7. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
8. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
9. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
10. `apps/cli/test/commands/review-verify-command.test.ts`
11. `apps/cli/test/cli-governance-runtime.integration.test.ts`
