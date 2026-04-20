# Technical Solution Review

- Status: approved
- Date: 2026-04-19
- Solution ID: `technical-solution.acp-execution-bridge-and-invoke-stream-confirm-cutover`
- Draft Path: `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `review-draft-solution`
   - same-turn local main-agent revisions were applied before final approval
2. Target module:
   - `runtime.agent-projection`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
   - `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`
   - `packages/adapter-sdk/src/agent-route-runner.ts`
   - `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
   - `https://agentclientprotocol.com/protocol/session-setup`
   - `https://agentclientprotocol.com/protocol/tool-calls`
   - `https://agentclientprotocol.com/protocol/file-system`
   - `https://agentclientprotocol.com/protocol/terminals`
   - `https://paseo.sh/changelog`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`
5. Approval focus:
   - whether the draft keeps `acp_exec` separate from `cli_exec`
   - whether ACP execution ownership is placed on a concrete transport client rather than being conflated with `service-host`
   - whether `invokeStage` / `streamEvents` stay compatible with the current `AgentRouteRunner` ownership model
   - whether `requestConfirmation -> session/request_permission` is specified honestly against the current repo contract

## Reviewer Round

1. Local review round: `round-1-review-fix-and-approve`
2. Delegated review: not requested; review and same-turn draft revisions were completed locally under the `technical-solution-review` workflow.
3. Main-agent action:
   - accepted and revised `3` blocking issues in the draft
   - rechecked the updated draft against repo contracts, runtime boundaries, and the cited ACP/Paseo primary sources before approving

## Blocking Findings

1. None. 本轮批准前复核未发现剩余阻断性问题；初始 blocking finding 已在同一轮修订后全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-19]` draft 原先把 `requestConfirmation` 近似等同于 ACP `session/request_permission`，但当前 repo `AgentConfirmationRequest` 只有 `prompt / metadata / deadlineAt`，没有 ACP-native `toolCall / options` 语义，promotion 后会导致 confirmation bridge 没有稳定映射基础。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
   - Contract evidence:
     - `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`
     - `https://agentclientprotocol.com/protocol/tool-calls`
   - Main-agent disposition:
     - `accepted`
     - draft 现在明确把该处降格为“方向上可映射，但 promotion 前必须补齐 additive request facts 或收窄到 active tool-call context”

2. `[resolved 2026-04-19]` draft 原先把 `streamEvents` 设计成 ACP turn 的 primary owner，但当前 `AgentRouteRunner` 仍以 `invokeStage` 为主要 dispatch owner；如果不说明这一点，promotion 后很容易把 ACP 执行路径做成“只有先调用 stream 才能执行”的隐性前提。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
   - Runtime evidence:
     - `packages/adapter-sdk/src/agent-route-runner.ts`
     - `packages/adapter-sdk/src/agent-protocol.abstract.ts`
   - Main-agent disposition:
     - `accepted`
     - draft 现在要求 `invokeStage` 继续保持 self-sufficient，`streamEvents` 只能附着到同一次共享 turn execution，不能反向成为新的必经 owner

3. `[resolved 2026-04-19]` draft 原先把 `repo-ai-governor/service-host` / `LocalOrchestrationServiceSidecarHost` 直接描述成 ACP execution runtime import path，但现有 sidecar truth 只证明了 `sidecar + ipc` orchestration substrate，并没有天然承担 ACP JSON-RPC client ownership。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
   - Runtime evidence:
     - `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
     - `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`
     - `packages/core-orchestration-service/README.md`
     - `https://agentclientprotocol.com/protocol/transports`
   - Main-agent disposition:
     - `accepted`
     - draft 现在把 sidecar 收口为 bootstrap/runtime-service substrate，并新增显式 `CliAcpTransportClientRuntime` owner 来承接真实 ACP protocol transport loop

## Non-Blocking Suggestions

1. promotion 前可以补一张更细的 capability matrix，把 `analysis-only`、`coding-with-terminal`、`file-write-required` 三类 route 的 ACP capability floor 分开写，避免 implementation window 里把所有 `acp_exec` route 统一抬到最高 capability 门槛。

## Promotion Interlocks

1. 如果 promotion 要把 `requestConfirmation` 正式接到 `session/request_permission`，需要同步决定 `AgentConfirmationRequest` 是继续只靠 `metadata` 派生，还是引入 additive structured fields；不能在 implementation 阶段临时猜测 tool-call correlation shape。
2. 如果 promotion 要让 `streamEvents` 成为强 owner，就必须同步修改 `AgentRouteRunner` 与相关 consumer；否则必须保持 `invokeStage` self-sufficient。
3. `service-host` / sidecar 只能作为 bootstrap/runtime-service substrate 使用；ACP transport client ownership 不能被继续留白。
4. Paseo 只能作为 supplemental interoperability evidence；不能反向成为本方案的 canonical runtime owner。

## Main-Agent Recheck

1. `[resolved]` `requestConfirmation` 的 ACP mapping 已从“天然一一对应”收敛为“需要 active tool-call context 或 contract additive fields”的诚实表述。
2. `[resolved]` `invokeStage` 与 `streamEvents` 的所有权已经重新对齐现有 SDK/runtime truth，不再要求 `streamEvents` 先于 `invokeStage`。
3. `[resolved]` `service-host` / sidecar 与 ACP transport client 的职责已经拆开，sidecar 不再被误写成 ACP protocol client。
4. 更新后的 draft 仍保持：
   - `acp_exec` 与 `cli_exec` 严格分离
   - Paseo 只是 optional interoperability target
   - support wording uplift 继续后置到 rollout evidence

## Verification

1. Review baseline refreshed from:
   - target draft
   - lifecycle registry entry
   - module registry
   - PRD brief
   - `runtime.agent-projection` overview + onboarding / projection contracts + ACP ADRs
   - adapter-sdk protocol/route-runner contracts
   - sidecar host/service-host runtime surfaces
   - ACP official protocol docs and Paseo changelog as supplemental evidence
2. Verification commands:
   - `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
   - Result: `pass`
3. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Approval verdict:
   - no blocking findings remain
   - the draft is approved for later promotion cutover
3. Lifecycle recommendation:
   - update solution to `approved`
   - update `review_paths` to the canonical approved artifact path
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` for formal cutover
