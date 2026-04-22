# sprint-002-workflow-authoring-draft-session-baseline 计划

- Status: completed
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
| TK-1046 | extend workflow draft-session contract and client seams | TK-1038 | completed |
| TK-1047 | implement draft-session mutation runtime and replace cli workflow bridge | TK-1046 | completed |
| TK-1048 | wire vscode workflow studio authoring model and command surfaces | TK-1047 | completed |
| TK-1039 | land workflow draft session and schema-first authoring baseline | TK-1048 | completed |
| TK-1040 | close sprint-002 and hand off richer graph-editing readiness | TK-1039 | completed |

## 3. Exit Criteria

1. workflow draft session 的 revision / patch / conflict contract 已进入真实 implementation package，并完成 service/client/extension seam 映射。
2. schema-first authoring 与 graph projection 的 owner split 已可验证，且 workflow 命令不再优先走 CLI workspace-operation bridge。
3. `sprint-003` activation handoff 已明确 evidence boundary 与 support-truth gate。

## 4. Sprint Notes

1. richer graph editing 只能建立在 draft-session owner split 之上，不能抢跑 freeform canvas。
2. workflow authoring 的更强 claim 仍不等于 public support truth 已切换。
3. 2026-04-22：`TK-1038 / DA-1038` 已完成 sprint-001 closeout write-back；当前 sprint 已登记为 `current-context` 的 primary execution surface。
4. 2026-04-22：`TK-1046` 开工，sprint-002 从 `planned` 切换为 `active`，进入 workflow draft-session contract/runtime/VS Code authoring baseline 实施窗口。
5. 2026-04-22：`TK-1046 / TK-1047 / TK-1048 / TK-1039` 已完成代码、测试与 smoke 基线；当前 sprint-002 已具备发起 fresh delegated CR round 的实现状态，`TK-1040` 保持为后续 closeout / handoff 任务。
6. 2026-04-22：由于 workflow authoring baseline 仍暂驻 `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts` 这一 legacy 4k+ controller，`TK-1040` closeout 必须显式携带 `CS-027` temporary exception 与 sprint-003 focused extraction handoff，避免该例外在 sprint-002 closeout 后失去追踪。
7. 2026-04-23：`CR-014` 已以 clean round 收口，sprint-002 完成 closeout write-back；workflow draft-session authoring baseline 已冻结为 `completed`，并将 `CS-027` legacy controller temporary exception 与 richer graph editing / support-truth fail-closed gate 一并移交给 sprint-003。
