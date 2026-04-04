# project-038-session-main-capability-explainer-productization 计划

- Status: active
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

- Status: completed
- Sprint Goal: 为 capability explainer 建立单一事实来源、turn outcome metadata 与首条 governed bridge 实施包。
- Task Package: `TK-495`、`TK-496`、`TK-497`、`TK-498`、`TK-499`。

## 2.2 sprint-002-cli-benchmark-and-borrowing-analysis

- Status: completed
- Sprint Goal: 对标 `claude-code` 与 `codex` 的 CLI 架构、交互层与扩展能力，沉淀 `repo-ai-governor` 可借鉴能力分层建议与近期 adoption 顺序。
- Task Package: `TK-517`、`TK-518`、`TK-519`。

## 2.3 sprint-003-cli-borrowed-capabilities-technical-solution-drafting

- Status: completed
- Sprint Goal: 将 CLI benchmark 分析收敛为一份可行的技术方案草案，明确模块落点、 phased rollout 与 deferred bucket。
- Task Package: `TK-520`。

## 2.4 sprint-004-cli-borrowed-capabilities-rollout-decomposition

- Status: completed
- Sprint Goal: 基于 CLI 借鉴能力产品化技术方案草案，继续拆出 planned implementation project / sprint / task package。
- Task Package: `TK-529`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-495 | sprint-001 | establish session.main capability descriptor seed-view contract and canonical catalog baseline | runtime/catalog-contract | `DA-494` + active interactive-cli formal docs | completed |
| TK-496 | sprint-001 | cut over CLI help appendix and governed command discoverability to single-source capability catalog | cli/help-cutover | TK-495 | completed |
| TK-497 | sprint-001 | add session.main capability intent routing and explanation answer generation | runtime/explainer-routing | TK-495 | completed |
| TK-498 | sprint-001 | project capability explanation metadata into shared session truth and transcript affordances | runtime/shared-session-projection | TK-497 | completed |
| TK-499 | sprint-001 | add capability availability overlay governed execution bridge and sprint-001 exit acceptance | runtime/bridge-and-closeout | TK-496、TK-497、TK-498 | completed |
| TK-507 | sprint-001 | promote provider session reuse and backend conversation continuity draft into active formal docs | docs/promotion | approved draft + resolved review evidence | completed |
| TK-517 | sprint-002 | analyze borrowable cli capabilities from claude-code and codex and record draft recommendations | docs/cli-benchmark-analysis | current interactive shell baseline + local benchmark repos | completed |
| TK-518 | sprint-002 | supplement review review-verify and upgrade contract drafts and cross-link cli maturity analysis | docs/followup-contract-drafts | TK-517 | completed |
| TK-519 | sprint-002 | promote cli capability maturity analysis draft into active formal docs | docs/promotion | TK-518 + promotion review evidence | completed |
| TK-520 | sprint-003 | convert cli borrowing analysis into feasible technical solution draft | docs/technical-solution-draft | TK-517 + active interactive-shell and durable-storage formal docs | completed |
| TK-529 | sprint-004 | decompose cli borrowed capabilities draft into planned implementation rollout project and sprint packages | docs/implementation-decomposition | TK-520 + cli borrowed capabilities draft | completed |

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
4. 2026-04-03：显式激活 `project-038 / sprint-001` 作为新的 primary stream，并开始执行 `TK-495`。
5. 2026-04-03：完成 `TK-495`，建立 `runtime.orchestration` 单写源 capability catalog baseline，后续 `TK-496 ~ TK-499` 在该 seed/view seam 上继续扩展。
6. 2026-04-03：完成 `TK-499`，`sprint-001` exit acceptance 达成；availability overlay、同轮 governed bridge 与 transcript/shared-session continuity 基线已经冻结，见 [sprint-001-exit-acceptance-summary.md](./sprint-001-capability-catalog-and-turn-outcome-foundation/sprint-001-exit-acceptance-summary.md)。
7. 2026-04-04：在 `sprint-001` closeout surface 上补充 `TK-507`，将 `provider session reuse and backend conversation continuity` draft 正式提升为 active runtime technical solution，并同步 lifecycle/delivery/module/manifest/review/DA 证据。
8. 2026-04-04：根据用户确认的实现跟进需求，已创建 planned `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`，并将该 active solution 的 delivery handoff 从 promotion closeout surface 切换为 `followup_required`。
9. 2026-04-04：用户要求结合本地 `claude-code` 与 `codex` 仓库，对 `repo-ai-governor` CLI 做一次面向借鉴学习的对标分析；已为该工作创建 `sprint-002-cli-benchmark-and-borrowing-analysis`。
10. 2026-04-04：完成 `TK-517`，已将可借鉴能力分为“立即可借鉴 / 条件化引入 / 暂不建议照搬”，并写入 [CLI benchmark draft](../../../../draft/cli-borrowing-analysis-against-claude-code-and-codex.md)。
11. 2026-04-04：完成 `TK-518`，已补齐 `review / review-verify / upgrade` 的专项 contract draft，并与 CLI 成熟度分析文保持双向挂链。
12. 2026-04-04：完成 `TK-519`，已将 CLI 能力成熟度分析文正式化为 `runtime.cli-interactive-shell` ADR，并同步 lifecycle / delivery / module registry / manifest / review / DA 证据。
13. 2026-04-04：根据已正式化的 CLI 能力成熟度 ADR，已创建 planned `project-042-cli-command-thin-baseline-enhancement-rollout`，按 `upgrade -> plan -> review/review-verify` 三段式拆解 follow-up implementation stream。
14. 2026-04-04：用户进一步要求将 CLI benchmark 分析整理成可行技术方案草案；已创建 `sprint-003-cli-borrowed-capabilities-technical-solution-drafting` 作为 docs-only follow-up sprint。
15. 2026-04-04：完成 `TK-520`，已新增 [CLI borrowed capabilities productization draft](../../../../draft/cli-borrowed-capabilities-productization-technical-solution.md)，明确 session lifecycle、projection、adaptive runtime、dynamic discoverability、session note 与 startup budget 的 phased rollout。
16. 2026-04-04：用户继续要求“直接拆成 implementation sprint/task package”；已创建 `sprint-004-cli-borrowed-capabilities-rollout-decomposition` 作为 docs-only decomposition sprint。
17. 2026-04-04：完成 `TK-529`，已新增 planned [project-043-cli-session-shell-productization-rollout](../../project-043-cli-session-shell-productization-rollout/plan.md)，并将技术方案拆成 `sprint-001 ~ sprint-003` 与 `TK-530 ~ TK-538` 的实体 task package。
