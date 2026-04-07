# project-062-cli-continuity-and-adapter-truthfulness-hardening 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: CLI hardening follow-up
- Phase Mapping: provider-native continuity + adapter truth-source alignment
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
  - `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`

## 1. 目标

1. 把当前 CLI 从“fallback 能保住部分连续性”推进到更稳定的 provider-native continuity 能力面。
2. 收敛 `connect -> doctor -> verify -> transcript` 的同一真值源，减少“本机可用但探测失败”或“fallback 已生效但提示像故障”的失真。
3. 为后续 packaged/adopter/productization 主线建立更稳的 CLI truth base。

## 2. Sprint 细化

## 2.1 sprint-001-provider-continuation-state-model-and-fallback-boundary

- Status: completed
- Sprint Goal: 冻结 provider continuation 生命周期与 fallback-active 的 truthful 表达边界。
- Task Package: `TK-661`、`TK-662`、`TK-663`、`TK-697`。

## 2.2 sprint-002-adapter-probe-verify-truth-source-alignment

- Status: completed
- Sprint Goal: 收敛 `connect / doctor / verify / transcript` 对 adapter readiness 的真值来源与对外表达。
- Task Package: `TK-664`、`TK-665`、`TK-666`、`TK-698`、`TK-699`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-661 | sprint-001 | freeze provider continuation lifecycle and presenter truth contract | contract/runtime | project-058 / project-059 traceback | completed |
| TK-662 | sprint-001 | implement provider-native continuation slot lifecycle and fallback-active separation | runtime/implementation | TK-661 | completed |
| TK-663 | sprint-001 | close continuity hardening with session-shell regression and build evidence | acceptance/closeout | TK-661、TK-662 | completed |
| TK-697 | sprint-001 | sprint-001 closeout and sprint-002 activation handoff | closeout/handoff | TK-661、TK-662、TK-663、CR-001 | completed |
| TK-664 | sprint-002 | freeze connect doctor verify transcript truth-source contract | contract/diagnostics | TK-697 | completed |
| TK-665 | sprint-002 | implement adapter probe outcome classification and presenter-safe diagnostics alignment | adapter/implementation | TK-664 | completed |
| TK-666 | sprint-002 | close CLI truthfulness hardening with cross-adapter evidence refresh | project/closeout | TK-664、TK-665 | completed |
| TK-698 | sprint-002 | sprint-002 exit acceptance and project-final review activation handoff | closeout/handoff | TK-664、TK-665、TK-666、CR-001、CR-002 | completed |
| TK-699 | sprint-002 | finalize project-062 closeout and activate project-063 primary stream | closeout/final-audit | TK-698、CR-003 | completed |

## 4. 依赖产物策略

1. 先冻结 continuation lifecycle 与 truthful fallback boundary，再进入 runtime implementation。
2. `sprint-002` 只在 continuity boundary 稳定后启动，避免两类 truth drift 同时互相干扰。
3. closeout 结论必须包含至少一轮 session-shell regression 与同窗口 build evidence。

## 5. DoD（project-062）

1. CLI 能清楚区分 provider-native continuation、fallback-active continuity、unsupported/no-fallback。
2. adapter readiness 的 probe/verify/transcript 不再轻易互相打架。
3. 至少一轮 targeted regression + 同窗口 build evidence 已形成正式 closeout 证据。

## 6. 里程碑记录

1. 2026-04-08：`project-072` handoff 后已按用户指定顺序激活 `project-062 / sprint-001`，作为当前 primary stream。
2. 2026-04-08：当前 worktree 中已有的 CLI continuity / adapter truthfulness 改动已并入 `TK-661 ~ TK-663` 的实现面，先完成 sprint-001 再切到 `sprint-002`。
3. 2026-04-08：`CR-001` 已完成 accepted truthfulness finding 修复并 clean resolved；`TK-697 / DA-697` 已完成 sprint-001 closeout，并把下一边界固定为 `sprint-002 / TK-664`。
4. 2026-04-08：`TK-664 / TK-665` 已完成 `verify` tool-matrix truth-source freeze 与 diagnostics alignment；当前 project 活跃边界已切到 `TK-666` 的 evidence refresh / closeout 收口。
5. 2026-04-08：`TK-666` 已完成 same-window cross-adapter regression、build、package/integration verification，`project-062 / sprint-002` 的实现面已完成，当前进入 sprint-level delegated CR loop。
6. 2026-04-08：`CR-001 / CR-002` 已完成 delegated sprint review clean closure；`TK-698 / DA-698` 已把 `sprint-002` 收口为 project-final-ready surface，当前下一边界固定为 `project-062` project-final CR loop。
7. 2026-04-08：`CR-003` clean `resolved`；`TK-699 / DA-699` 已完成 final closeout write-back 并激活 `project-063 / sprint-001`，项目完成态审计摘要已落盘：`.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/project-062-cli-continuity-and-adapter-truthfulness-hardening-completion-audit-summary.md`。
