# project-038-session-main-capability-explainer-productization 计划

- Status: planned
- Date: 2026-04-02
- Stage Mapping: Interactive CLI capability explanation implementation follow-up
- Phase Mapping: Capability catalog truth / explainer routing / shared-session projection / governed guidance bridge
- Upstream:
  - `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/project-035-session-main-supervisor-and-role-subagent-productization-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-001-shared-liveness-contract-and-codex-watchdog-baseline/tasks/DA-494-session-main-capability-explainer-and-contextual-guidance-promotion-cutover.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`

## 1. 目标

1. 将 `session.main capability explainer + contextual command guidance` 从 formal solution amendment 落成真实 implementation stream，而不再停留在 promotion evidence。
2. 为 `session.main` 建立 service-owned capability catalog、i18n seed/view 分层与 help truth 单写源。
3. 让 capability explanation 在 `session.main` 中成为正式路由分支，并把 explanation metadata 投影到 shared session truth 与 CLI transcript consumer。
4. 保持 governed capability 与 shell-local builtins 的边界，并让 explanation -> execute 继续复用既有 governed skill / preview-confirm seam。

## 2. Sprint 细化

## 2.1 sprint-001-capability-catalog-and-turn-outcome-foundation

- Status: planned
- Sprint Goal: 为 capability explainer 建立单一事实来源、turn outcome metadata 与首条 governed bridge 实施包。
- Task Package: `TK-495`、`TK-496`、`TK-497`、`TK-498`、`TK-499`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-495 | sprint-001 | establish session.main capability descriptor seed-view contract and canonical catalog baseline | runtime/catalog-contract | `DA-494` + active interactive-cli formal docs | planned |
| TK-496 | sprint-001 | cut over CLI help appendix and governed command discoverability to single-source capability catalog | cli/help-cutover | TK-495 | planned |
| TK-497 | sprint-001 | add session.main capability intent routing and explanation answer generation | runtime/explainer-routing | TK-495 | planned |
| TK-498 | sprint-001 | project capability explanation metadata into shared session truth and transcript affordances | runtime/shared-session-projection | TK-497 | planned |
| TK-499 | sprint-001 | add capability availability overlay governed execution bridge and sprint-001 exit acceptance | runtime/bridge-and-closeout | TK-496、TK-497、TK-498 | planned |

## 4. 依赖产物策略

1. `DA-494` 是 capability explainer formal promotion 的 handoff artifact；`project-038` 承接的是实现交付，不重复改写 formal solution semantics。
2. `runtime.orchestration` / `core-orchestration-service` 拥有 capability catalog、intent routing、answer generation 与 shared-session projection 真值。
3. `runtime.cli-interactive-shell` 与 `apps/cli` 只消费 capability truth 并负责 presenter / transcript affordance，不得重新维护第二份 capability prose。
4. shell-local builtins 继续由 CLI slash registry 自治；`project-038` 只统一 governed capability discoverability metadata，不把 `/confirm`、`/clear`、`/exit` 等 builtin 误沉到 canonical catalog。
5. explanation -> execute 的桥接只能复用既有 `direct_execute` / `preview_confirm` seam；不得引入新的 answer-only pending state。

## 5. DoD（project-038）

1. 已存在 service-owned `SessionMainCapabilityCatalog`，并以 locale-neutral seed + localized view 作为 canonical capability truth。
2. `session.main` 已能稳定识别 `capability_overview / detail / examples / comparison` 等 explanation intent，且不再被 skill route 误吞。
3. shared session truth 已能稳定承载 `capabilityAnswerKind`、`referencedCapabilityIds` 与 `suggestedActions` 等 explanation metadata。
4. CLI help appendix、governed slash discoverability 与 `session.main` explanation 已消费同一份 capability catalog truth。
5. availability overlay 与 explainer-to-skill bridge 已能解释当前是否可执行、为何要 preview/confirm，以及如何从 explanation 平滑进入 governed execution。

## 6. 里程碑记录

1. 2026-04-02：用户确认 capability explainer 方案不应只停留在 formal promotion 记录上，需要补充独立 implementation task decomposition。
2. 2026-04-02：创建 `project-038-session-main-capability-explainer-productization`，并以 `sprint-001-capability-catalog-and-turn-outcome-foundation` 作为首个 planned implementation sprint。
3. 2026-04-02：将 `technical-solution.interactive-cli-react-style-cli` 的 delivery handoff 从历史 completed rollout 更新为 `followup_required -> planned project-038 / sprint-001`，确保当前 active solution 的实现 ownership 与 formal amendment 范围保持一致。
