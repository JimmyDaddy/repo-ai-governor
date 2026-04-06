# project-048-governance-surface-clients-rollout 计划

- Status: completed
- Date: 2026-04-05
- Stage Mapping: governance surface clients rollout
- Phase Mapping: shared core and actionable console / VS Code companion / governance evidence / automation queue
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`
  - `.repo-ai-governor/context/dev/project-047-governance-surface-clients-solution-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-558-governance-surface-clients-promotion-and-rollout-decomposition-handoff.md`
  - `apps/desktop/README.md`
  - `apps/desktop/src/types/interfaces/desktop-preload.interface.ts`
  - `apps/desktop/src/runtime/desktop-preload-bridge.ts`

## 1. 目标

1. 将 `technical-solution.governance-surface-clients` 从 formal direction 推进到真实 multi-surface rollout。
2. 先补 shared core 与 actionable desktop console，再落地 VS Code companion MVP，之后补 governance evidence 与 automation queue。
3. 保持 `Desktop = outer-loop governance command center`、`VS Code = inner-loop editor companion`、`CLI = scriptable/automation entry` 的职责分工。

## 2. Sprint 细化

## 2.1 sprint-001-shared-core-and-actionable-console-baseline

- Status: completed
- Sprint Goal: 先补 command/query seam 与 actionable desktop console baseline。
- Task Package: `TK-559`、`TK-560`、`TK-561`。

## 2.2 sprint-002-vscode-editor-companion-mvp

- Status: completed
- Sprint Goal: 落地 VS Code 插件 MVP 的 view/chat/tool/command surface。
- Task Package: `TK-562`、`TK-563`、`TK-564`。

## 2.3 sprint-003-desktop-governance-evidence-surface

- Status: completed
- Sprint Goal: 为 desktop 补齐 policy trace、review lifecycle 与 governance evidence surface。
- Task Package: `TK-565`、`TK-566`、`TK-567`。

## 2.4 sprint-004-automation-queue-and-multi-workspace-governance

- Status: completed
- Sprint Goal: 为 desktop 补齐 automation/review queue、多 workspace 与 closeout readiness。
- Task Package: `TK-568`、`TK-569`、`TK-570`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-559 | sprint-001 | freeze governance surface client command query seam and actionable console scope | contract/foundation | formal module docs | completed |
| TK-560 | sprint-001 | expose desktop hitl recovery actions and execution board hitl inbox query surfaces | desktop/actionable-console | TK-559 | completed |
| TK-561 | sprint-001 | land worktree editor handoff and actionable console regression acceptance | desktop/handoff-and-acceptance | TK-559、TK-560 | completed |
| TK-562 | sprint-002 | freeze VS Code editor companion MVP extension contract and surface boundary | vscode/contract | TK-561 | completed |
| TK-563 | sprint-002 | implement Governor view container chat participant and editor local governed commands | vscode/mvp-implementation | TK-562 | completed |
| TK-564 | sprint-002 | wire review hitl context views workspace trust gating and extension acceptance | vscode/acceptance | TK-562、TK-563 | completed |
| TK-565 | sprint-003 | freeze governance evidence read model and artifact workbench detail contract | desktop/evidence-contract | TK-561 | completed |
| TK-566 | sprint-003 | implement policy trace review lifecycle navigation and governance evidence surfaces | desktop/evidence-implementation | TK-565 | completed |
| TK-567 | sprint-003 | close desktop governance evidence surface with targeted verification and docs sync | desktop/evidence-closeout | TK-565、TK-566 | completed |
| TK-568 | sprint-004 | freeze automation inbox review queue and multi workspace governance policy | desktop/queue-contract | TK-567 | completed |
| TK-569 | sprint-004 | implement automation review queue notifications and parallel lane overview | desktop/queue-implementation | TK-568 | completed |
| TK-570 | sprint-004 | close governance surface clients rollout with release readiness and project audit | rollout/closeout | TK-568、TK-569 | completed |

## 4. 依赖产物策略

1. sprint-001 必须优先完成，因为所有后续 surface 都依赖 shared command/query seam 与 actionable console baseline。
2. sprint-002 只在 sprint-001 稳定后启动，避免 VS Code extension 在 editor host 内长出 shadow runtime。
3. sprint-003 负责本产品最关键的治理差异化：policy trace、review lifecycle、governance evidence。
4. sprint-004 最后承接 async queue、multi-workspace 与 closeout readiness，不提前抢跑。

## 5. DoD（project-048）

1. desktop 已具备 actionable console baseline，不再只是只读面板集合。
2. VS Code 插件已形成 editor-native companion MVP，不是重型 webview 套壳。
3. governance evidence、review lifecycle 与 policy trace 已形成可解释的 desktop surface。
4. automation/review queue 与 multi-workspace governance 已进入正式 rollout，并完成 closeout evidence。

## 6. 里程碑记录

1. 2026-04-05：基于 `technical-solution.governance-surface-clients` promotion cutover 创建 `project-048`，作为新的 planned follow-up stream。
2. 2026-04-05：已将 `sprint-001 ~ sprint-004` 与 `TK-559 ~ TK-570` 全量拆解写入 project / sprint / task surface，待后续窗口按顺序激活。
3. 2026-04-05：已激活 `sprint-001-shared-core-and-actionable-console-baseline` 为 active primary stream，并按 `TK-559 -> TK-560 -> TK-561` 顺序开始执行。
4. 2026-04-05：`sprint-001-shared-core-and-actionable-console-baseline` 已在 reviewer 子 agent 循环达到零 actionable finding 后收口为 `completed`，并激活 `sprint-002-vscode-editor-companion-mvp` / `TK-562`。
5. 2026-04-05：`sprint-002-vscode-editor-companion-mvp` 已完成 real VS Code extension app 的 contract freeze、view/chat/command/code-action implementation 与 acceptance 自测，当前进入 reviewer 子 agent CR 闭环。
6. 2026-04-05：`sprint-002-vscode-editor-companion-mvp` 已在 reviewer 子 agent 第二轮复审达到零 actionable finding 后收口为 `completed`，并切换 `sprint-003-desktop-governance-evidence-surface` / `TK-565` 为 active primary execution surface。
7. 2026-04-05：`sprint-003-desktop-governance-evidence-surface` 已完成 evidence DTO freeze、desktop evidence sections 实现、targeted tests、build 与 desktop smoke，当前进入 reviewer 子 agent CR 闭环。
8. 2026-04-05：`sprint-003-desktop-governance-evidence-surface` 已在 reviewer 子 agent 最终复审达到零 actionable finding 后收口为 `completed`，并切换 `sprint-004-automation-queue-and-multi-workspace-governance` / `TK-568` 为 active primary execution surface。
9. 2026-04-05：`sprint-004` 已完成 queue overview contract freeze 与 desktop automation/review queue、parallel lane、workspace summary、notification ownership surface 实现，并切换 `TK-570` 为 active closeout task，待进入 sprint-004 reviewer 子 agent CR 闭环。
10. 2026-04-05：`sprint-004` implementation reviewer loop 已由子 agent 复审收口为零 actionable finding；当前继续保持 `TK-570` 为 active closeout task，进入 `project-048` 最终全量 CR 与 completion audit 阶段。
11. 2026-04-05：project-level reviewer 子 agent 最终结论为 `No actionable findings.`，已形成 `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-004-automation-queue-and-multi-workspace-governance/review/resolved_code_review_project-048-final-rollup.md`。
12. 2026-04-05：已形成 `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/project-048-governance-surface-clients-rollout-completion-audit-summary.md`，`project-048` 正式切换为 `completed`。
