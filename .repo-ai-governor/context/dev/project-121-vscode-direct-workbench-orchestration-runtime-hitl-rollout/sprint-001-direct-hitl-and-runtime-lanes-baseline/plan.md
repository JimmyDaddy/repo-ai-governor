# sprint-001-direct-hitl-and-runtime-lanes-baseline 计划

- Status: completed
- Date: 2026-04-22
- Sprint Goal: 冻结 direct HITL cockpit 与 runtime-lane service contract baseline，补齐 DTO/query/runtime/vscode code slices，并形成 workflow draft session activation handoff
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-direct-workbench-orchestration-runtime-hitl.md`
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Scope

1. 补齐 `queryHitlDecisionPacket / queryRoleLaneStatus / querySessionContinuity` 的 client/sidecar/service seam，并保持 `submitHitlDecision / recoverExecution / terminateExecution` 继续复用既有 trust/policy gate。
2. 将 `Runtime Lanes` 与 `HITL Decision Cockpit` 从 coarse queue/evidence-only surface 推进到 direct-workbench DTO-backed vscode runtime/presentation baseline。
3. 形成 `Phase B` workflow draft-session baseline 的 activation handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1037 | freeze direct hitl cockpit and runtime-lane contract baseline | approved solution review | completed |
| TK-1043 | extend direct-workbench runtime dto and sidecar contracts | TK-1037 | completed |
| TK-1044 | implement role-lane status and hitl-decision query runtime | TK-1043 | completed |
| TK-1045 | wire vscode runtime lanes and hitl cockpit surfaces | TK-1044 | completed |
| TK-1038 | close sprint-001 and hand off workflow draft session baseline | TK-1045 | completed |

## 3. Exit Criteria

1. direct HITL 与 runtime-lane Phase A contract baseline 已冻结为可执行 task package，并映射到明确的 service/client/extension code surfaces。
2. `Runtime Lanes` 与 `HITL Decision Cockpit` 已具备 direct-workbench DTO-backed baseline，而不是只停留在 coarse queue/evidence-only projection。
3. `sprint-002` activation handoff 已明确 workflow draft session 的 required inputs 与 phase guard。
4. sprint scaffold、ledger 与 planned follow-up stream registry truth 保持一致。

## 4. Sprint Notes

1. 本 sprint 现已完成 delegated CR loop clean 收口，并通过 `TK-1038 / DA-1038` 将 closeout、handoff 与 execution-context truth 恢复到最终 `completed` 真值。
2. runtime status bus 必须继续是 service-owned projection，不允许插件侧二次拼装。
3. HITL cockpit 必须完整复用现有 risk facts / SLA contract，不允许 summary-only 降级。
4. 2026-04-22：`CR-018` 作为 fresh clean recheck 未发现新的 actionable findings；当前只保留旧 sidecar binary 未做 live backward-compatibility 实机覆盖的 residual risk note。
5. 2026-04-22：`sprint-002` 已切换为 `current-context` 的 primary execution surface，但在 `TK-1046` 开工前，其 sprint plan 与 task aggregate 继续保持 `planned`。
