# sprint-002-workflow-authoring-draft-session-baseline 计划

- Status: planned
- Date: 2026-04-22
- Sprint Goal: 落 workflow draft session service seam、schema-first authoring 与 conflict-safe patch mutation baseline
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1038-sprint-001-closeout-and-sprint-002-activation-handoff.md`
  - `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-direct-workbench-authoring-runtime-lanes-and-hitl-decision-cockpit.md`

## 1. Scope

1. 实现 `workflow draft session` 的 `draft_revision / base_definition_revision / supported_patch_ops[] / conflict_state` service/client/sidecar seam。
2. 将 `Workflow Studio` 从 evidence-only + CLI bridge 路径推进到 schema-first authoring + graph projection baseline。
3. 为 richer graph-editing readiness 与 support-truth boundary 形成 `Phase C` activation handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1046 | extend workflow draft-session contract and client seams | TK-1038 | planned |
| TK-1047 | implement draft-session mutation runtime and replace cli workflow bridge | TK-1046 | planned |
| TK-1048 | wire vscode workflow studio authoring model and command surfaces | TK-1047 | planned |
| TK-1039 | land workflow draft session and schema-first authoring baseline | TK-1048 | planned |
| TK-1040 | close sprint-002 and hand off richer graph-editing readiness | TK-1039 | planned |

## 3. Exit Criteria

1. workflow draft session 的 revision / patch / conflict contract 已进入真实 implementation package，并完成 service/client/extension seam 映射。
2. schema-first authoring 与 graph projection 的 owner split 已可验证，且 workflow 命令不再优先走 CLI workspace-operation bridge。
3. `sprint-003` activation handoff 已明确 evidence boundary 与 support-truth gate。

## 4. Sprint Notes

1. richer graph editing 只能建立在 draft-session owner split 之上，不能抢跑 freeform canvas。
2. workflow authoring 的更强 claim 仍不等于 public support truth 已切换。
3. 2026-04-22：`TK-1038 / DA-1038` 已完成 sprint-001 closeout write-back；当前 sprint 已登记为 `current-context` 的 primary execution surface，但在 `TK-1046` 正式开工前，sprint plan 与 task aggregate 继续保持 `planned`。
