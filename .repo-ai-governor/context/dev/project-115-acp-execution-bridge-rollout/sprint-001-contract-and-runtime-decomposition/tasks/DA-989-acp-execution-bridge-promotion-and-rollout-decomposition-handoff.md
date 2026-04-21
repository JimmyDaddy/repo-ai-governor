# DA-989 acp execution bridge promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-989`
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-001-contract-and-runtime-decomposition`

## 1. Summary

1. `technical-solution.acp-execution-bridge-and-invoke-stream-confirm-cutover` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.agent-projection` 的 shared overview 增量，以及新的 producer ADR `acp-execution-bridge-and-invoke-stream-confirm-cutover.md`。
3. implementation follow-up 已拆解为 `project-115-acp-execution-bridge-rollout` 的五个 planned sprint。
4. 当前 active truth 已在 `project-115 / sprint-001` 落地 `acp_exec` 的 bridge-backed executable direction、runtime owner split、shared invocation boundary 与 restricted confirmation mapping；当前代码仍保持 fail-closed，不宣称 clean-room execution、packaged distribution、runtime-service evidence、external interoperability 或 support wording uplift 已在本窗口完成。

## 2. Current Runtime Boundary

1. `CliAcpHostProtocol` 现在只保留 host-facing entrypoint 组装职责；probe availability、transport seam、session bookkeeping、prompt-turn orchestration 与 host-operation bridge 已拆到独立 runtime owners。
2. `CliAcpExecutionStateStore` 以 `surfaceId::processId::executionId::stageId::routeKey` 作为 shared invocation key，保证后续 `invokeStage / streamEvents` 可以绑定到同一个 ACP-local execution row，而不把 ACP-local ids 提升成 canonical session truth。
3. `invokeStage`、`streamEvents` 与 `requestConfirmation` 当前依然 fail-closed，并继续返回 ACP-specific unavailable error；这一步只 formalize ownership，不把 `acp_exec` 伪装成 `cli_exec` 或做双执行。

## 3. Next Activation Recommendation

1. 下一条建议激活的 implementation stream 仍固定为 `project-115 / sprint-002-executable-acp-exec-baseline`，但前提是当前 `sprint-001` 完成 fresh delegated review、accepted finding 修复、`pnpm run check` 与 boundary local commit。
2. `sprint-002` 必须聚焦：
   - `session/new`、`session/prompt` 与 `session/cancel` 的真实 `acp_exec` execution bridge
   - `invokeStage / streamEvents` 复用同一个 shared invocation turn，而不是重新解释为 `cli_exec`
   - 明确避免 double-execution、`cli_exec` aliasing 与过早 support claim
3. 若后续 reviewer 发现 ownership boundary 仍有模糊点，优先在 `sprint-001` 内收敛，不把 unresolved contract debt 带入 `sprint-002`。
4. `2026-04-20`：该 activation recommendation 已被消费；`CR-001` resolved 后，primary execution surface 已切换到 `sprint-002-executable-acp-exec-baseline / TK-992`。

## 4. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-execution-bridge-and-invoke-stream-confirm-cutover.md`
2. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/plan.md`
4. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/plan.md`
5. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
6. `apps/cli/src/runtime/cli-acp-capability-discovery-runtime.ts`
7. `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
8. `apps/cli/src/runtime/cli-acp-session-runtime.ts`
9. `apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`
10. `apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
11. `apps/cli/src/runtime/cli-acp-execution-state-store.ts`
