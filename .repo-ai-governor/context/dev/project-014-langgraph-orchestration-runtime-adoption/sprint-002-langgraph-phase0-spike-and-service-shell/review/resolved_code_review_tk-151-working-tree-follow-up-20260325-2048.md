# Code Review: TK-151 sqlite-fs checkpointer and service shell working tree follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-151`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-149-file-backed-checkpointer-and-recovery-smoke-baseline.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`

## 1. Review Scope
1. `apps/cli/src/cli-governance-runtime.ts`
2. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
4. `packages/core-runtime-langgraph/src/langgraph-checkpointer.abstract.ts`
5. `packages/core-runtime-langgraph/src/sqlite-fs-checkpointer.ts`
6. `packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts`
7. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
8. Supporting task, plan, and artifact-registry updates tied to `TK-151` / `DA-151`

## 2. Findings
### 2.1 [P1] Public service contract still makes the client own execution and process identity
- 位置: `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts:8`, `apps/cli/src/cli-governance-runtime.ts:348`
- 问题描述: `startExecution()` now requires callers to supply `executionId`, `executionSessionId`, and `processId`, and the CLI passes those values from outside the service. This freezes client-owned runtime identity into the new transport-neutral DTO package, even though `DA-144` explicitly defines the service owner as the component that generates/reuses execution/session identifiers and hides runtime internals from CLI/desktop clients.
- 影响: Once this public package is consumed by a desktop client or an IPC bridge, the repository either has to keep leaking runtime/compiler internals to clients or accept a breaking API change later. That undermines the single-runtime-owner boundary this sprint is meant to establish.
- 建议: Keep `OrchestrationStartExecutionRequest` limited to client-facing inputs (`workspace`, `executionKind`, `taskId`, `locale`, `outputMode`, `clientSurface`) and move execution/session ID allocation plus `processId` derivation behind the service owner. If Phase 0 still needs an escape hatch, keep that as a non-exported internal shell method instead of the public client contract.

### 2.2 [P1] `submitHitlDecision()` exposes a stable API without the required durable receipt/audit writeback
- 位置: `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts:74`, `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:147`
- 问题描述: The new public HITL API only updates in-memory status and returns `{ accepted, nextStatus }`. It does not write a decision receipt artifact, does not append an execution event, and the response type omits `decisionReceiptArtifactPath?`, even though `DA-144` defines receipt/audit persistence as mandatory behavior for this API surface.
- 影响: A future CLI/desktop client can start using the exported HITL endpoint and observe a resumed execution state while the workspace has no durable receipt or audit evidence. That breaks the canonical-source and governance-traceability guarantees the existing HITL flow depends on.
- 建议: Do not publish `submitHitlDecision()` as a supported client-contract method until it writes the receipt/audit chain and returns the receipt path. If Phase 0 still routes HITL persistence through CLI runtime code, keep the method internal or explicitly unsupported in the public package.

### 2.3 [P2] Shared checkpoint validation no longer rejects unknown interrupt kinds
- 位置: `packages/core-runtime-langgraph/src/langgraph-checkpointer.abstract.ts:195`
- 问题描述: The extracted `assertPendingInterruptShape()` now only checks that `pendingInterrupt.kind` is a non-empty string. The previous file-backed validator rejected values outside the supported interrupt set (`hitl`, `timeout`, `cancelled`). The new base class is documented as the shared fail-closed validator for both checkpoint transports, but a tampered sqlite row with `kind: "unexpected"` would now be accepted and returned as a recovered interrupt instead of throwing `PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID`.
- 影响: Checkpoint corruption or schema drift can silently change recovery semantics instead of failing closed, weakening the safety contract established by `DA-149` and carried forward into `DA-151`.
- 建议: Restore membership validation against `LANGGRAPH_RUNTIME_INTERRUPT_KINDS` in the shared base class and add a negative sqlite-fs test that proves unknown interrupt kinds are rejected.

## 3. Notes
1. 台账、sprint plan 状态和 artifact lifecycle 门禁均通过，未发现本次变更引入的治理记录漂移。
2. 定向类型检查和测试通过，但它们没有覆盖上面的 public contract drift 与 fail-closed regression 场景。
3. `node:sqlite` 的 experimental warning 仍会在直接加载 sqlite checkpointer/unit tests 时出现；当前改动只规避了 `cli --help` 场景。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 复核结论（2026-03-25）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`OrchestrationStartExecutionRequest` 现在只保留 `workspace / executionKind / task / locale / outputMode / clientSurface` 这些 client-facing 字段；execution/session/process identity 已移到 `LocalOrchestrationServiceShell.startExecution(..., runtimeContext?)` 的 shell 内部上下文，不再由 `orchestration-service-client` DTO 暴露。
   - 处理：已修复。
2. `2.2`
   - 判定：**部分认可**
   - 证据：报告指出的两个问题里，`decisionReceiptArtifactPath` 缺失和 receipt artifact 未持久化是成立的，且确实与 `DA-144` 的 HITL Resume API 最小响应字段不一致；但“当前必须完整接入 service-owned audit recorder，否则不应暴露方法”这部分我不完全认可，因为 `submitHitlDecision()` 仍处于 Phase 0 in-process shell，尚未被 desktop/IPC client 消费，`DA-152` 也已把 service-backed execution/audit 扩围明确留给 sprint-003。
   - 处理：已补 `decisionReceiptArtifactPath`、durable receipt artifact 和 `artifact.ready` event；完整 service-owned audit persistence 保持为 sprint-003 约束，不在本次修复范围内。
3. `2.3`
   - 判定：**认可**
   - 证据：`assertPendingInterruptShape()` 之前只校验非空字符串，未约束 `kind` 必须属于 `LANGGRAPH_RUNTIME_INTERRUPT_KINDS`；现在已恢复集合校验，并补了 sqlite-fs 篡改用例。
   - 处理：已修复。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-03-25）

1. `2.1`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`、`apps/cli/src/cli-governance-runtime.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit`（通过）
   - 说明：公开 `startExecution` DTO 已去掉 execution/session/process identity；CLI 改为通过 shell 内部 runtime context 传递这组运行时标识。
2. `2.2`：已完成（认可子项）
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：已补 `decisionReceiptArtifactPath`、durable HITL decision receipt artifact 和 `artifact.ready` event；service-owned audit recorder 继续留在 sprint-003 扩围。
3. `2.3`：已完成
   - 变更文件：`packages/core-runtime-langgraph/src/langgraph-checkpointer.abstract.ts`、`packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：恢复 interrupt kind 集合校验，并新增 sqlite-fs tampered checkpoint 负向用例。
