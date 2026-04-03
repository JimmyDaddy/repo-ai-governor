# project-039-provider-session-reuse-and-backend-conversation-continuity-rollout 计划

- Status: completed
- Date: 2026-04-04
- Stage Mapping: Provider-native backend conversation continuity rollout
- Phase Mapping: Continuation contract baseline / lane-scoped shared-session slot lifecycle / Codex remote phase-A reuse / presenter-safe summary and provider readiness governance
- Upstream:
  - `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-001-capability-catalog-and-turn-outcome-foundation/tasks/DA-507-provider-session-reuse-and-backend-conversation-continuity-technical-solution-promotion.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/provider-session-reuse-and-continuation-handle-seam.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-501-roll-out-api-key-remote-adapter-invocation-runtime-transport-and-delivery-verification.md`

## 1. 目标

1. 将 active formal solution `technical-solution.provider-session-reuse-and-backend-conversation-continuity` 从文档真值落成真实 implementation stream，而不是继续停留在 promotion evidence。
2. 为 `mode / status / transportKind / handleKind` 等 continuation 闭集语义建立集中常量治理，避免 adapter 与 runtime 再次漂移成 inline string literal。
3. 在 shared session truth 下正式引入 lane-scoped provider continuation slot lifecycle，并明确 `sessionId` 只作为 trace metadata 透传，不进入 `laneKey` 身份边界。
4. 先以 `Codex remote API` 作为 phase-A 落地链路，交付 `created / reused / cleared / unsupported` 的正式 request-result reuse 闭环。
5. 为 `session.main`、CLI transcript、resume 与未来 desktop consumer 冻结 presenter-safe continuation summary contract，同时把 `Codex CLI / Claude / GitHub Copilot` 的 adoption gate 收敛为显式 provider readiness guardrail。

## 2. Sprint 细化

## 2.1 sprint-001-continuation-contract-slot-lifecycle-and-codex-remote-baseline

- Status: completed
- Sprint Goal: 为 provider continuation 建立集中 contract/constants、lane-scoped shared-session slot lifecycle，并落成 `Codex remote API` 的首条 reuse baseline。
- Task Package: `TK-508`、`TK-509`、`TK-510`。

## 2.2 sprint-002-summary-projection-and-provider-readiness-governance

- Status: completed
- Sprint Goal: 将 continuation summary 投影到 `session.main / CLI transcript / resume` consumer，并补齐 invalidation、fallback、Codex CLI readiness 与 provider adoption governance。
- Task Package: `TK-511`、`TK-512`、`TK-513`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-508 | sprint-001 | establish centralized provider continuation constants and adapter invoke contract baseline | runtime/adapter-sdk-contract | `technical-solution.provider-session-reuse-and-backend-conversation-continuity` active formal docs + `DA-507` | completed |
| TK-509 | sprint-001 | implement lane-scoped provider continuation slot lifecycle in shared session and orchestration runtime | runtime/shared-session-lifecycle | TK-508 | completed |
| TK-510 | sprint-001 | roll codex remote api onto provider continuation reuse baseline | runtime/codex-remote-rollout | TK-508、TK-509、`technical-solution.api-key-remote-adapter-invocation` active rollout baseline | completed |
| TK-511 | sprint-002 | project presenter-safe continuation summaries into session.main transcript and resume consumers | cli/runtime-summary-projection | TK-509、TK-510 | completed |
| TK-512 | sprint-002 | add continuation invalidation stateless-retry and resume fallback regression coverage | runtime/regression-governance | TK-509、TK-510、TK-511 | completed |
| TK-513 | sprint-002 | probe codex cli continuation readiness and freeze provider adoption guardrails | runtime/provider-readiness | TK-510、TK-512 | completed |

## 4. 依赖产物策略

1. `runtime.agent-projection` 拥有 adapter-facing continuation request/result seam 与 raw handle 语义；实现层必须先在 `adapter-sdk` 冻结集中常量与 contract，再让各 adapter 对齐。
2. `runtime.orchestration` / `core-session` 拥有 `laneKey`、`providerContinuations` slot state、slot-aware mutation、invalidation rule 与 turn-level continuation summary；`sessionId` 只能作为 trace metadata 透传，不得进入 `laneKey` 本体，也不得被 adapter 当作 provider continuation identity。
3. `runtime.cli-interactive-shell` 与 `apps/cli` 只消费 presenter-safe continuation summary，不得读取 raw handle、slot map 或 provider-private reference。
4. 第一阶段只承诺 `Codex remote API` 的正式 reuse baseline；`Codex CLI`、`Claude remote API`、`Claude CLI` 与 `GitHub Copilot` 是否接入，取决于 provider 是否公开稳定 continuation contract。
5. provider continuation 必须保持 truthfulness：只有显式 `created / reused / refreshed` 才代表 reuse 成立；invalid handle 必须清 slot，并且最多只允许一次 stateless retry。

## 5. DoD（project-039）

1. `packages/adapter-sdk` 已正式拥有 continuation constants、request/result contract 与 transport/provider-compatible reuse truth baseline。
2. `packages/core-session` 与 `packages/core-orchestration-service` 已能持久化 lane-scoped continuation slot、执行 invalidation，并投影 presenter-safe summary。
3. `packages/adapters/codex` 的 remote-api path 已支持 continuation request/result 闭环，且 invalid handle 后可以安全回退到 stateless retry。
4. `session.main`、CLI transcript 与 resume consumer 只暴露 presenter-safe continuation summary，不泄露 raw provider handle。
5. continuation invalidation、surface fallback、resume parity 与 provider readiness guardrail 已有可验证回归证据。

## 6. 里程碑记录

1. 2026-04-04：用户批准 `provider session reuse and backend conversation continuity` active formal solution 后，明确要求继续做 implementation task decomposition，而不是停留在 docs-only promotion closeout。
2. 2026-04-04：创建 `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`，并将 rollout 拆为两个 planned sprint：baseline implementation 与 consumer/readiness governance。
3. 2026-04-04：在 `current-context.md` 中登记 `project-039 / sprint-001` 为 planned follow-up stream，同时保留 `project-038` 作为临时 closeout surface。
4. 2026-04-04：将 `technical-solution.provider-session-reuse-and-backend-conversation-continuity` 的 delivery handoff 从 `docs_only` 切换为 `followup_required -> project-039 / sprint-001`。
5. 2026-04-04：根据用户指令将 `project-039 / sprint-001` 显式切换为当前 primary implementation stream，并激活 `TK-508` 作为首个执行任务。
6. 2026-04-04：完成 `TK-508` ~ `TK-513` 全部交付，已通过 continuation 定向回归与 `pnpm run build`；`project-039` 正式切换为 `completed`，并产出 [project-039 completion audit summary](./project-039-provider-session-reuse-and-backend-conversation-continuity-rollout-completion-audit-summary.md)。
