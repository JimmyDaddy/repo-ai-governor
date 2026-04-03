# project-037-agent-invoke-liveness-and-timeout-governance-rollout 计划

- Status: active
- Date: 2026-04-02
- Stage Mapping: Runtime agent invoke governance implementation
- Phase Mapping: Shared liveness contract rollout / Codex-first watchdog baseline / cross-adapter alignment / diagnostics cutover and governance closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/layered-adapter-health-check-and-route-capability-probe.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/project-036-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/DA-485-agent-invoke-liveness-and-timeout-governance-technical-solution-promotion.md`

## 1. 目标

1. 将 `hard timeout` 从“主要异常判定”降级为最后保险丝，并在 runtime 内建立统一的 invoke liveness state machine。
2. 让 `Codex`、`GitHub Copilot`、`Claude Code`、`Ollama / local-model` 共享同一套 process liveness、transport activity、semantic progress 与 terminal completion 投影语义。
3. 在 `session.main`、interactive shell、doctor/verify 与 execution details 中稳定呈现 `running / suspect stall / graceful interrupt / hard terminate / partial output preserved`。
4. 为长 review / verifier / tester 建立可验证的 watchdog、graceful interrupt、partial output preservation 与 regression governance 基线。

## 2. Sprint 细化

## 2.1 sprint-001-shared-liveness-contract-and-codex-watchdog-baseline

- Status: completed
- Sprint Goal: 为 invoke lifecycle 建立 shared liveness runtime/telemetry 基线，并完成首批 formal-solution / delivery governance 收口；剩余 `Codex`-specific watchdog cutover 已迁移到 `sprint-003`。
- Task Package: `TK-486`、`TK-492`、`TK-493`、`TK-494`、`TK-500`。

## 2.2 sprint-002-cross-adapter-liveness-rollout-and-diagnostics

- Status: completed
- Sprint Goal: 将 shared invoke-liveness contract 扩展到 `GitHub Copilot`、`Claude Code` 与 `Ollama / local-model`，并承接 `api-key remote adapter invocation` formal solution 的 transport-aware rollout / delivery verification follow-through。
- Task Package: `TK-488`、`TK-489`、`TK-501`、`TK-502`、`TK-503`、`TK-504`。

## 2.3 sprint-003-graceful-interrupt-cutover-and-governance-closeout

- Status: active
- Sprint Goal: 承接从 `sprint-001` 迁入的 `Codex` graceful interrupt / watchdog 残余实现，并将 invoke-liveness state machine 正式接入 `session.main`、interactive shell、doctor/verify 与 delivery gate，完成预算、回归矩阵与 cutover closeout。
- Task Package: `TK-487`、`TK-490`、`TK-491`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-486 | sprint-001 | implement shared invoke liveness runtime telemetry and watchdog baseline | runtime/adapter-sdk | `contract.runtime.agent-invoke-liveness.v1` | completed |
| TK-492 | sprint-001 | prepare api-key remote adapter invocation technical solution promotion readiness and follow-up mapping | docs/governance | `runtime.agent-projection` active contracts + draft solution review | completed |
| TK-493 | sprint-001 | align active invoke liveness formal solution with amended orchestration projection and diagnostics boundaries | docs/governance | `technical-solution.agent-invoke-liveness-and-timeout-governance` active formal docs | completed |
| TK-494 | sprint-001 | promote session-main capability explainer and contextual guidance draft into active interactive-cli formal docs | docs/governance | `technical-solution.interactive-cli-react-style-cli` active formal docs + approved draft | completed |
| TK-500 | sprint-001 | promote api-key remote adapter invocation draft into active runtime-agent-projection formal docs | docs/promotion | TK-492 + approved draft | completed |
| TK-488 | sprint-002 | align claude-code and github-copilot with shared invoke liveness contract | runtime/adapter-rollout | TK-486 | completed |
| TK-489 | sprint-002 | align ollama local-model and long-operation progress protections with invoke liveness governance | runtime/local-model-rollout | TK-486 | completed |
| TK-501 | sprint-002 | roll out api-key remote adapter invocation runtime transport and delivery verification | runtime/adapter-rollout | `technical-solution.api-key-remote-adapter-invocation` active formal docs + TK-486 | completed |
| TK-502 | sprint-002 | integrate remote-api streaming liveness and execution diagnostics projection | runtime/diagnostics-rollout | TK-486、TK-501 | completed |
| TK-503 | sprint-002 | extend remote-api onboarding verification and credential-boundary surfaces | cli/runtime-verification | `technical-solution.api-key-remote-adapter-invocation` active formal docs + TK-501 | completed |
| TK-504 | sprint-002 | add remote-api delivery verification and clean-room smoke coverage | release/verification | TK-501 | completed |
| TK-487 | sprint-003 | roll codex onto shared invoke liveness watchdog graceful interrupt and partial output preservation | runtime/codex-adapter | TK-486、TK-488 | planned |
| TK-490 | sprint-003 | route session-main interactive shell and doctor verify through invoke liveness diagnostics | cli/runtime-diagnostics | TK-487、TK-488、TK-489 | planned |
| TK-491 | sprint-003 | deliver invoke liveness regression budgets cutover governance and rollout closeout | governance/cutover | TK-490 | planned |

## 4. 依赖产物策略

1. `technical-solution.agent-invoke-liveness-and-timeout-governance` 已完成 formal promotion；`project-037` 承接的是实现 rollout，而不是再次修改目标方案。
2. `runtime.agent-projection` 提供统一 contract 和 ADR；实现层必须优先复用 shared runtime，而不是在各 adapter 中重新发明 timeout/watchdog 逻辑。
3. `Codex` 是 Phase B 的首条落地链路，但不得在 contract 上形成只适用于 Codex 的特化真值。
4. `GitHub Copilot`、`Claude Code`、`Ollama / local-model` 可以分阶段 rollout，但最终必须统一 reason code、状态机与 partial-output 语义。
5. `session.main`、interactive shell、doctor/verify 与 execution details 只能消费 shared invoke-liveness projection，不应直接依赖某个 adapter 的私有事件 taxonomy。
6. 若 active formal solution 在 rollout 前补充了 orchestration projection 或 diagnostics boundary clarified amendments，必须先同步 formal contract/ADR，再继续实现层 rollout，避免 implementation stream 依赖过期正式文档。

## 5. DoD（project-037）

1. `packages/adapter-sdk` 已具备 shared invoke-liveness runtime、状态机、reason code 与 timeout-budget baseline。
2. `hard timeout` 在受支持 surface 上不再是唯一异常判定依据；`transport idle / semantic stall / graceful interrupt / hard terminate` 已可区分。
3. `Codex`、`GitHub Copilot`、`Claude Code`、`Ollama / local-model` 都能将底层执行信号投影到统一 invoke-liveness contract。
4. `session.main`、interactive shell、doctor/verify 与 execution details 已能稳定呈现 invoke-liveness 状态与 partial output preservation 结果。
5. route / role / surface 级 timeout budget 覆盖与 regression matrix 已明确可验证，delivery gate 能解释为何继续等待、为何开始中断、为何最终 fail-closed。

## 6. 里程碑记录

1. 2026-04-02：用户已批准 `agent invoke liveness / timeout governance` formal solution；确认该范围应作为独立实现窗口处理，而不是继续挂在 `project-036` completed closeout surface。
2. 2026-04-02：创建 `project-037-agent-invoke-liveness-and-timeout-governance-rollout`，并将 shared runtime、Codex-first rollout、cross-adapter alignment、diagnostics/governance closeout 拆成 3 个 sprint。
3. 2026-04-02：激活 `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline` 作为新的 primary planning surface，并冻结 `TK-486`、`TK-487`。
4. 2026-04-02：登记 planned `sprint-002-cross-adapter-liveness-rollout-and-diagnostics` 与 `sprint-003-graceful-interrupt-cutover-and-governance-closeout`，避免后续实现继续回流到 `project-036`。
5. 2026-04-02：补充 `TK-492`，为 `api-key remote adapter invocation` draft 建立 promotion-readiness review artifact、lifecycle `review_pending` 条目与 follow-up mapping，避免后续 formalization 缺少治理锚点。
6. 2026-04-02：补充 `TK-494`，将 `session-main capability explainer + contextual command guidance` draft 以 amendment 方式正式并入 active solution `technical-solution.interactive-cli-react-style-cli`，同步 interactive-shell / orchestration formal docs 与 lifecycle/delivery/ledger evidence。
7. 2026-04-02：完成 `TK-500` formal promotion；`technical-solution.api-key-remote-adapter-invocation` 已正式并入 `runtime.agent-projection` 模块，形成 transport-aware contract delta、remote-api binding ADR、delivery handoff 与 promotion review/DA 证据。
8. 2026-04-02：在 planned `sprint-002` 中补充 `TK-501`，作为 `api-key remote adapter invocation` 的 runtime rollout / delivery verification follow-up surface。
9. 2026-04-02：执行 `TK-501` baseline implementation，已交付 remote-api config/routing 与 Codex/Claude probe+invoke baseline；剩余流式 liveness、onboarding/credential boundary 与 delivery smoke 覆盖拆分为 `TK-502`、`TK-503`、`TK-504`。
10. 2026-04-03：完成 `TK-502`、`TK-503`、`TK-504` 的 follow-through 收口；`api-key remote adapter invocation` 已补齐 streaming liveness、credential boundary、dist-binary remote-api rehearsal、clean-room `path/link/tgz` smoke 与 delivery evidence，delivery registry 现已同步为 `completed`。
11. 2026-04-03：完成 `TK-488`，`Claude Code CLI / GitHub Copilot CLI` 已对齐 shared invoke-liveness 状态机与 graceful-interrupt orchestration consumer 回归。
12. 2026-04-03：执行 sprint-001 台账纠偏：`TK-486` 回填为 `completed`，`TK-487` 迁移到 `sprint-003` 继续承接残余 Codex-specific watchdog closeout；`sprint-001` 现正式切换为 `completed`，active primary stream 转为 `sprint-002`。
13. 2026-04-03：完成 `TK-489` 收口并结束 `sprint-002`：`Ollama / local-model` 已对齐 shared invoke-liveness snapshot、done reason、timeout budget、partial-output preservation 与长 idle progress protection；cross-adapter rollout / remote-api follow-through package 全部完成，primary planning surface 切换到 `sprint-003`。
