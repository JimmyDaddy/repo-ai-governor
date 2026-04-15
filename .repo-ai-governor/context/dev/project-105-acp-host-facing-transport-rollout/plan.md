# project-105-acp-host-facing-transport-rollout 计划

- Status: completed
- Date: 2026-04-14
- Stage Mapping: ACP host-facing transport rollout
- Phase Mapping: explicit transport routing and companion carrier / packaged distribution and runtime-service enablement / clean-room verify support truth and closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. 目标

1. 将 `technical-solution.acp-host-facing-transport-formalization` 从 formal direction 推进到真实 rollout。
2. 在不改写现有 `cli_exec` canonical truth 的前提下，落地显式 `acp_exec` transport、`acp_host_companion` carrier、packaged distribution 与 runtime-service evidence。
3. 保持 host-facing ACP 作为独立 transport truth，不把 support/docs uplift 提前写成已完成 public support。

## 2. Sprint 细化

## 2.1 sprint-001-acp-host-facing-transport-rollout

- Status: completed
- Sprint Goal: 初始化 ACP host-facing transport rollout baseline，并冻结第一阶段 implementation boundary。
- Task Package: `TK-860`、`TK-882`、`TK-883`、`TK-884`

## 2.2 sprint-002-distribution-and-runtime-service-enablement

- Status: completed
- Sprint Goal: 推进 `acp_exec` readiness composition、packaged distribution 与 runtime-service enablement。
- Task Package: `TK-885`、`TK-886`、`TK-887`

## 2.3 sprint-003-clean-room-verify-support-truth-and-rollout-closeout

- Status: completed
- Sprint Goal: 执行 clean-room verify、support/docs truth uplift，并完成 rollout closeout。
- Task Package: `TK-888`、`TK-889`、`TK-890`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-860 | sprint-001 | implement ACP host-facing transport rollout baseline | rollout/planned | DA-855 | completed |
| TK-882 | sprint-001 | implement explicit acp_exec transport routing and fail-closed separation from cli_exec | transport/routing | TK-860 | completed |
| TK-883 | sprint-001 | project acp_host_companion carrier without polluting session or continuation canonical truth | companion/carrier | TK-882 | completed |
| TK-884 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-860、TK-882、TK-883、activation-time local CR-001 | completed |
| TK-885 | sprint-002 | integrate connect doctor verify readiness composition for acp_exec and host next-actions | onboarding/readiness | TK-884 | completed |
| TK-886 | sprint-002 | enable packaged-distribution and runtime-service surfaces behind explicit ACP boundaries | distribution/runtime-service | TK-885 | completed |
| TK-887 | sprint-002 | sprint-002 exit acceptance and sprint-003 activation handoff | sprint/closeout | TK-885、TK-886、latest fresh reviewer clean round | completed |
| TK-888 | sprint-003 | execute clean-room ACP verification and distribution runtime evidence capture | verify/evidence | TK-887 | completed |
| TK-889 | sprint-003 | uplift ACP adopter-facing support docs truth only for evidence-backed surfaces while preserving cli_exec separation | support/docs | TK-888 | completed |
| TK-890 | sprint-003 | finalize project-105 closeout and delivery evidence handoff | closeout/delivery | TK-888、TK-889、project-final CR-003 | completed |

## 4. 依赖产物策略

1. 必须先消费 `DA-855` 与 active ACP ADR，再进入任何 host-facing implementation。
2. 虽然 ACP 技术上是独立分支，但默认仍排在 `project-104` 之后执行，避免在 cli_exec 主链未收口前过早放大 host-facing surface。
3. `sprint-001` 只处理独立 transport routing 与 `acp_host_companion` carrier；`sprint-002` 才承接 packaged distribution/runtime-service；`sprint-003` 才承接 clean-room verify、support/docs truth 与 closeout。
4. 本次 decomposition 不预创建 `CR-xxx` task card；每个 sprint 激活后必须先预留本地 `CR-001` 并走 `workspace-scoped-cr-loop`。

## 5. DoD（project-105）

1. `project-105` 已激活为三阶段 ACP rollout stream，当前 `sprint-001` 是新的 primary implementation surface。
2. `acp_exec` routing、`acp_host_companion`、packaged distribution/runtime-service、clean-room verify 与 support/docs uplift 的 implementation boundary 已完整落到 task package。
3. rollout 不得把 ACP 回写成 `cli_exec` success，也不得在 evidence clean 前把 packaged distribution、runtime-service 或 support wording 写成已完成。

## 6. 里程碑记录

1. 2026-04-13：由 `project-101 / TK-855` promotion cutover 创建为 planned follow-up stream。
2. 2026-04-14：`project-105` 已扩展为三阶段 execution-ready scaffold，并固定为 5 方向 rollout 的最后一条默认执行流。
3. 2026-04-15：`project-104` final closeout 完成后，当前 project 已切换为 active，并将 `sprint-001` 激活为新的 primary execution surface。
4. 2026-04-15：`CR-001 ~ CR-009` 已全部收口，latest fresh reviewer round clean；`sprint-001` 完成 closeout，并将 `sprint-002` 激活为新的 primary execution surface，`TK-885` 进入 `in_progress`。
5. 2026-04-15：`CR-001` repair round 与 `CR-002` clean recheck 已全部 resolved；`sprint-002` 完成 closeout，并将 `sprint-003` 激活为新的 primary execution surface，`TK-888` 进入 `in_progress`。
6. 2026-04-15：`TK-888` clean-room ACP verification / evidence capture 与 `TK-889` support/docs truth uplift implementation boundary 已完成；`.tmp/project-105-sprint-003-acp-cleanroom-report.json` 与 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json` 已写回，随后 `CR-001` 修复 round 已收口为 `resolved`。
7. 2026-04-15：`sprint-003 / CR-002` 已作为 fresh clean recheck round 激活；只有当最新 reviewer round 无 actionable finding 后，才允许进入 sprint closeout 与 project-final review。
8. 2026-04-15：`sprint-003 / CR-002` clean recheck 已收口为 `resolved`；current sprint boundary 现已 clean，下一步在同一 surface 上执行 project-final fresh review，clean 后再完成 `TK-890` 与 project closeout。
9. 2026-04-15：project-final `CR-003` 已 clean 收口，`TK-890` 已完成 delivery / audit / idle closeout；`project-105` 正式完成。

## 7. 里程碑记录入口

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/project-105-acp-host-facing-transport-rollout-completion-audit-summary.md`
