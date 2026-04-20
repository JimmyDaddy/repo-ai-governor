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
4. 当前 active truth 只 formalize `acp_exec` 的 bridge-backed executable direction、runtime owner split、shared invocation boundary 与 restricted confirmation mapping；不宣称 clean-room execution、packaged distribution、runtime-service evidence、external interoperability 或 support wording uplift 已在本窗口完成。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-115 / sprint-001-contract-and-runtime-decomposition`。
2. 第一批必须优先冻结：
   - `requestConfirmation -> session/request_permission` 的 additive mapping / structured-facts 决策
   - `CliAcpTransportClientRuntime` 与 sidecar substrate 的职责分离
   - `invokeStage / streamEvents` 共享 turn execution 与 `acp_invocation_key` 基线
3. 在 `sprint-001` clean 收口前，不建议抢跑 packaged clean-room claim、external interoperability claim 或 adopter-facing support wording uplift。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-execution-bridge-and-invoke-stream-confirm-cutover.md`
2. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/plan.md`
4. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-002-executable-acp-exec-baseline/plan.md`
5. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-003-permission-terminal-filesystem-bridge-hardening/plan.md`
6. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/plan.md`
7. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/plan.md`
