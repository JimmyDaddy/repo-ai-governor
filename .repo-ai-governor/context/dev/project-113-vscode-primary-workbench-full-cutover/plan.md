# project-113-vscode-primary-workbench-full-cutover 计划

- Status: active
- Date: 2026-04-17
- Stage Mapping: technical solution rollout follow-up
- Phase Mapping: phase-d onboarding / phase-e operations / phase-f secure authoring / phase-g workflow authoring / phase-h support promotion
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. 目标

1. 承接 VS Code primary governance workbench 在 Phase D 到 Phase H 的后续全量拆解。
2. 覆盖 onboarding、operations、secure authoring、workflow authoring 与 support-promotion/distribution-readiness 五段 execution surface。
3. 为后续执行提供完整的 multi-sprint plan、task cards、review scaffold 与 canonical task-ledger seed，且不提前激活 current-context。

## 2. Sprint 细化

## 2.1 sprint-001-phase-d-onboarding-cutover

- Status: completed
- Sprint Goal: 完成 onboarding cutover contract、service seam 与 VS Code readiness surface 的标准执行骨架
- Task Package: `TK-942、TK-943、TK-944、TK-945、CR-001、CR-002、CR-003`

## 2.2 sprint-002-phase-e-operations-cutover

- Status: completed
- Sprint Goal: 完成 operations cutover、service-native operations seam 与 bridge-exit governance 的标准执行骨架
- Task Package: `TK-946、TK-947、TK-948、TK-949、CR-001、CR-002、CR-003`

## 2.3 sprint-003-phase-f-secure-authoring-and-user-settings

- Status: completed
- Sprint Goal: 完成 secure authoring、user settings 与 secret readiness UX 的标准执行骨架
- Task Package: `TK-950、TK-951、TK-952、TK-953、CR-001、CR-002`

## 2.4 sprint-004-phase-g-workflow-authoring-and-run-control

- Status: completed
- Sprint Goal: 完成 workflow authoring、governed run-control 与 workflow studio continuity 的标准执行骨架
- Task Package: `TK-954、TK-955、TK-956、TK-957、CR-001、CR-002`

## 2.5 sprint-005-phase-h-support-promotion-and-distribution-readiness

- Status: active
- Sprint Goal: 完成 support-truth promotion、distribution readiness evidence 与 public-claim gate package 的标准执行骨架
- Task Package: `TK-958、TK-959、TK-960、TK-961、CR-001`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-942 | sprint-001-phase-d-onboarding-cutover | freeze phase-d onboarding contract | onboarding contract baseline | DA-934 | completed |
| TK-943 | sprint-001-phase-d-onboarding-cutover | implement onboarding aggregation facade and diagnostics seams | onboarding service seam | freeze phase-d onboarding contract | completed |
| TK-944 | sprint-001-phase-d-onboarding-cutover | land onboarding wizard and readiness workbench surfaces | onboarding workbench surface | implement onboarding aggregation facade and diagnostics seams | completed |
| TK-945 | sprint-001-phase-d-onboarding-cutover | prepare sprint-001 exit acceptance and phase-e handoff | governance handoff | land onboarding wizard and readiness workbench surfaces | completed |
| CR-001 | sprint-001-phase-d-onboarding-cutover | verify phase-d onboarding cutover | review | prepare sprint-001 exit acceptance and phase-e handoff | resolved |
| CR-002 | sprint-001-phase-d-onboarding-cutover | sprint-001-phase-d-onboarding-cutover delegated recheck loop round 2 | review recheck | verify phase-d onboarding cutover | resolved |
| CR-003 | sprint-001-phase-d-onboarding-cutover | sprint-001-phase-d-onboarding-cutover delegated recheck loop round 3 | review recheck | sprint-001-phase-d-onboarding-cutover delegated recheck loop round 2 | resolved |
| TK-946 | sprint-002-phase-e-operations-cutover | freeze phase-e operations cutover and bridge-exit criteria | operations cutover contract | prepare sprint-001 exit acceptance and phase-e handoff | completed |
| TK-947 | sprint-002-phase-e-operations-cutover | implement service-native operations seams and receipts | operations service seam | freeze phase-e operations cutover and bridge-exit criteria | completed |
| TK-948 | sprint-002-phase-e-operations-cutover | land operations workbench surfaces and bridge fallback governance | operations workbench surface | implement service-native operations seams and receipts | completed |
| TK-949 | sprint-002-phase-e-operations-cutover | prepare sprint-002 exit acceptance and phase-f handoff | governance handoff | land operations workbench surfaces and bridge fallback governance | completed |
| CR-001 | sprint-002-phase-e-operations-cutover | verify phase-e operations cutover | review | prepare sprint-002 exit acceptance and phase-f handoff | resolved |
| CR-002 | sprint-002-phase-e-operations-cutover | sprint-002-phase-e-operations-cutover delegated recheck loop round 2 | review recheck | verify phase-e operations cutover | resolved |
| CR-003 | sprint-002-phase-e-operations-cutover | sprint-002-phase-e-operations-cutover delegated review loop round 3 | review recheck | sprint-002-phase-e-operations-cutover delegated recheck loop round 2 | resolved |
| TK-950 | sprint-003-phase-f-secure-authoring-and-user-settings | freeze phase-f secure authoring boundary | secure authoring contract | prepare sprint-002 exit acceptance and phase-f handoff | completed |
| TK-951 | sprint-003-phase-f-secure-authoring-and-user-settings | implement secure authoring seams and redaction baseline | secure authoring seam | freeze phase-f secure authoring boundary | completed |
| TK-952 | sprint-003-phase-f-secure-authoring-and-user-settings | land user settings and secret readiness ux | secure authoring ux | implement secure authoring seams and redaction baseline | completed |
| TK-953 | sprint-003-phase-f-secure-authoring-and-user-settings | prepare sprint-003 exit acceptance and phase-g handoff | governance handoff | land user settings and secret readiness ux | completed |
| CR-001 | sprint-003-phase-f-secure-authoring-and-user-settings | verify phase-f secure authoring baseline | review | prepare sprint-003 exit acceptance and phase-g handoff | resolved |
| CR-002 | sprint-003-phase-f-secure-authoring-and-user-settings | sprint-003-phase-f-secure-authoring-and-user-settings delegated review loop round 2 | review recheck | verify phase-f secure authoring baseline | resolved |
| TK-954 | sprint-004-phase-g-workflow-authoring-and-run-control | freeze phase-g workflow authoring and run-control contract | workflow authoring contract | prepare sprint-003 exit acceptance and phase-g handoff | completed |
| TK-955 | sprint-004-phase-g-workflow-authoring-and-run-control | implement workflow authoring and governed run-control seams | workflow run-control seam | freeze phase-g workflow authoring and run-control contract | completed |
| TK-956 | sprint-004-phase-g-workflow-authoring-and-run-control | land workflow studio control surfaces and continuity ux | workflow studio surface | implement workflow authoring and governed run-control seams | completed |
| TK-957 | sprint-004-phase-g-workflow-authoring-and-run-control | prepare sprint-004 exit acceptance and phase-h handoff | governance handoff | land workflow studio control surfaces and continuity ux | completed |
| CR-001 | sprint-004-phase-g-workflow-authoring-and-run-control | verify phase-g workflow authoring and run control | review | prepare sprint-004 exit acceptance and phase-h handoff | resolved |
| CR-002 | sprint-004-phase-g-workflow-authoring-and-run-control | sprint-004-phase-g-workflow-authoring-and-run-control delegated recheck loop round 2 | review recheck | verify phase-g workflow authoring and run control | resolved |
| TK-958 | sprint-005-phase-h-support-promotion-and-distribution-readiness | freeze phase-h promotion and distribution-readiness boundary | promotion boundary | prepare sprint-004 exit acceptance and phase-h handoff | in_progress |
| TK-959 | sprint-005-phase-h-support-promotion-and-distribution-readiness | execute gui and distribution readiness evidence bundle | evidence bundle | freeze phase-h promotion and distribution-readiness boundary | planned |
| TK-960 | sprint-005-phase-h-support-promotion-and-distribution-readiness | refresh support-truth docs and claim-promotion package | support truth package | execute gui and distribution readiness evidence bundle | planned |
| TK-961 | sprint-005-phase-h-support-promotion-and-distribution-readiness | prepare project-final closeout and next-stream recommendation | project closeout handoff | refresh support-truth docs and claim-promotion package | planned |
| CR-001 | sprint-005-phase-h-support-promotion-and-distribution-readiness | verify phase-h promotion evidence and readiness deltas | review | prepare project-final closeout and next-stream recommendation | planned |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-113-vscode-primary-workbench-full-cutover）

1. 5 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. 任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。
3. 在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。

## 6. 里程碑记录

1. 2026-04-17：创建 project-113-vscode-primary-workbench-full-cutover 全量执行流骨架，覆盖 sprint-001-phase-d-onboarding-cutover、sprint-002-phase-e-operations-cutover、sprint-003-phase-f-secure-authoring-and-user-settings、sprint-004-phase-g-workflow-authoring-and-run-control、sprint-005-phase-h-support-promotion-and-distribution-readiness。
2. 2026-04-17：已激活 `project-113 / sprint-001-phase-d-onboarding-cutover` 作为 primary stream；Phase D 实现边界已收敛到 optional chat participant registration、core command fallback 与 activation regression evidence。
3. 2026-04-17：`CR-001` 已接受并修复“chat-capable activation path 缺少正向回归覆盖”的 risk-based finding，随后 `CR-002` 被激活为 fresh post-fix recheck round。
4. 2026-04-17：`CR-002` 已接受并修复“plan surfaces 未同步当前 blocking review round”的治理漂移；随后 `CR-003` 被激活为 fresh clean recheck round。
5. 2026-04-17：`CR-003` clean round 已返回无 actionable finding，sprint-001 正式完成 closeout；当前 primary stream 已切换到 sprint-002，`TK-946` 进入 `in_progress`，下一步从停放的 `phase-e.patch` 重放 degraded fallback 实现边界。
6. 2026-04-17：Phase E degraded fallback delta 已从 `.tmp/project-113-boundary-parking/phase-e.patch` 重放到工作树；service runtime、review detail、workflow studio 与 presenter failure surfaces 已完成实现并通过定向测试，当前进入 sprint-002 `CR-001` fresh reviewer round。
7. 2026-04-17：`CR-001` 已接受并修复“artifact-pane restore failure 假空态 + HITL fallback 证据缺口”两条 finding；当前 `CR-002` 已被激活为 fresh post-fix recheck round，继续作为 sprint-002 closeout 前的 blocking review surface。
8. 2026-04-17：`CR-002` 已接受并修复 `CS-022` standardized-error gate 命中与 `CS-017` helper annotation 缺口；随后 `CR-003` 被激活为 fresh clean recheck round。
9. 2026-04-17：`CR-003` clean round 未发现 actionable finding，sprint-002 正式完成 closeout；当前 primary stream 已切换到 sprint-003，`TK-950` 进入 `in_progress` activation truth，下一步从 clean baseline 开始推进 secure authoring / settings / secret readiness UX。
10. 2026-04-17：`CR-002` 已在 sprint-003 同窗口完成 accepted finding 修复与复验，当前 sprint-003 正式完成 closeout；primary stream 已切换到 sprint-004，`TK-954` 进入 `in_progress` activation truth，下一步从 clean baseline 推进 workflow authoring / governed run-control / workflow studio continuity UX。
11. 2026-04-17：Phase G 的实现边界已在当前窗口落地：workflow studio 现支持 service-backed command URI action surface、session continuity additive projection 与 temporary bridge authoring affordance；`TK-954 ~ TK-956` 已切到 `completed`，`TK-957` 当前进入 sprint gate / review-ready 收口阶段。
12. 2026-04-17：sprint-004 implementation gate 已 clean 通过，`TK-957` 已完成 exit acceptance 与 Phase H handoff 收口；下一步固定进入 `CR-001` fresh delegated reviewer round，review clean 后再执行 sprint-004 closeout 与 sprint-005 activation。
13. 2026-04-17：`CR-001` 已完成 accepted finding 修复并进入 `resolved`；当前 `CR-002` 已被激活为 sprint-004 的 fresh post-fix recheck round，用于在 closeout 前确认 Phase G boundary clean。
14. 2026-04-17：`CR-002` fresh reviewer round-2 新发现 review-only command URI clear-marker 漏口；主 agent 已接受该 P2，并补上 transport-safe clear flag 与真实 URI round-trip coverage，当前 round 进入 `verified`，等待同窗口复验后收口。
15. 2026-04-17：`CR-002` 已在同窗口完成 accepted P2 修复、review lifecycle 收口与 ledger sync；sprint-004 正式完成 closeout，`stream-project-113-sprint-004` 转入 completed history，当前 primary stream 已切换到 sprint-005，`TK-958` 进入 `in_progress` activation truth。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
