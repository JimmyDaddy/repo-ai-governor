# project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout 计划

- Status: active
- Date: 2026-04-22
- Stage Mapping: technical solution rollout
- Phase Mapping: direct HITL and runtime lanes / workflow authoring draft session / richer graph editing and support-truth readiness
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-direct-workbench-orchestration-runtime-hitl.md`
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-direct-workbench-authoring-runtime-lanes-and-hitl-decision-cockpit.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`

## 1. 目标

1. 将 `technical-solution.vscode-direct-workbench-orchestration-runtime-hitl` 拆解为可直接映射到 `packages/core-orchestration-service`、`packages/orchestration-service-client` 与 `apps/vscode-extension` 的 implementation-ready rollout queue。
2. 按 `Phase A -> Phase B -> Phase C` 依次推进 direct HITL/runtime lanes baseline、workflow draft-session authoring baseline 与 richer graph-editing/support-truth readiness，并为每一阶段补齐 service/client/extension/test 任务面。
3. 为 delivery registry 与 `current-context.md` 提供真实可激活的 planned follow-up stream，而不是悬空 follow-up 叙述。

## 2. Sprint 细化

## 2.1 sprint-001-direct-hitl-and-runtime-lanes-baseline

- Status: completed
- Sprint Goal: 冻结 direct HITL cockpit 与 runtime-lane service contract baseline，补齐 DTO/query/runtime/vscode code slices，并形成 Phase B activation handoff
- Task Package: `TK-1037、TK-1043、TK-1044、TK-1045、TK-1038`

## 2.2 sprint-002-workflow-authoring-draft-session-baseline

- Status: planned
- Sprint Goal: 落 workflow draft session service seam、schema-first authoring 与 conflict-safe patch mutation baseline
- Task Package: `TK-1046、TK-1047、TK-1048、TK-1039、TK-1040`

## 2.3 sprint-003-richer-graph-editing-and-support-truth-readiness

- Status: planned
- Sprint Goal: 补齐 richer graph editing code path、delivery evidence suite 与更强 direct-workbench support-truth readiness
- Task Package: `TK-1049、TK-1050、TK-1041、TK-1042`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1037 | sprint-001-direct-hitl-and-runtime-lanes-baseline | freeze direct hitl cockpit and runtime-lane contract baseline | runtime/direct-workbench contract baseline | approved solution review | completed |
| TK-1043 | sprint-001-direct-hitl-and-runtime-lanes-baseline | extend direct-workbench runtime dto and sidecar contracts | service/client/sidecar contract | TK-1037 | completed |
| TK-1044 | sprint-001-direct-hitl-and-runtime-lanes-baseline | implement role-lane status and hitl-decision query runtime | service query runtime | TK-1043 | completed |
| TK-1045 | sprint-001-direct-hitl-and-runtime-lanes-baseline | wire vscode runtime lanes and hitl cockpit surfaces | vscode runtime/presentation | TK-1044 | completed |
| TK-1038 | sprint-001-direct-hitl-and-runtime-lanes-baseline | close sprint-001 and hand off workflow draft session baseline | governance handoff | TK-1045 | completed |
| TK-1046 | sprint-002-workflow-authoring-draft-session-baseline | extend workflow draft-session contract and client seams | workflow authoring contract | TK-1038 | planned |
| TK-1047 | sprint-002-workflow-authoring-draft-session-baseline | implement draft-session mutation runtime and replace cli workflow bridge | service mutation/runtime | TK-1046 | planned |
| TK-1048 | sprint-002-workflow-authoring-draft-session-baseline | wire vscode workflow studio authoring model and command surfaces | vscode authoring runtime | TK-1047 | planned |
| TK-1039 | sprint-002-workflow-authoring-draft-session-baseline | land workflow draft session and schema-first authoring baseline | workflow authoring baseline | TK-1048 | planned |
| TK-1040 | sprint-002-workflow-authoring-draft-session-baseline | close sprint-002 and hand off richer graph-editing readiness | governance handoff | TK-1039 | planned |
| TK-1049 | sprint-003-richer-graph-editing-and-support-truth-readiness | implement richer graph editing and projection-backed workflow studio | vscode graph editing/runtime projection | TK-1040 | planned |
| TK-1050 | sprint-003-richer-graph-editing-and-support-truth-readiness | land direct-workbench evidence suite and support-truth readiness package | evidence/test/distribution package | TK-1049 | planned |
| TK-1041 | sprint-003-richer-graph-editing-and-support-truth-readiness | verify direct-workbench evidence boundary and support-truth readiness | evidence and rollout readiness | TK-1050 | planned |
| TK-1042 | sprint-003-richer-graph-editing-and-support-truth-readiness | finalize project-121 rollout closeout and delivery evidence handoff | closeout and delivery evidence | TK-1041 | planned |

## 4. 依赖产物策略

1. formal contract / ADR 更新优先回链到 `runtime.governance-clients` 与 `runtime.orchestration` 的 module docs，不在 project docs 内维护平行 contract 真值。
2. planned sprint 只创建 canonical scaffold；真正进入 active execution 前，再通过 ledger sync 与 activation write-back 接入当前主执行流。
3. public support truth 与 packaged distribution wording 继续沿用既有 active truth；只有 `project-121` Phase C evidence clean 收口后，才允许讨论更强 direct-workbench claim。

## 5. DoD（project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout）

1. `project-121` 的三阶段 planned sprint queue、implementation-level task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. delivery registry 与 `current-context.md` 都已经回链到真实 planned rollout surface。
3. 每个 sprint 都已经具备清晰的 service/client/extension/test 实现面、handoff 边界与 evidence gate，不再依赖纯叙述性 follow-up 维持真值。

## 6. 里程碑记录

1. 2026-04-22：创建 `project-121` 的三阶段 planned rollout scaffold，并将 `sprint-001-direct-hitl-and-runtime-lanes-baseline` 登记到 `current-context.md -> Planned Follow-Up Streams`。
2. 2026-04-22：formal promotion 已把 direct-workbench authoring/runtime lanes/HITL cockpit direction materialize 到 module docs、contracts、manifest、lifecycle 与 delivery registry。
3. 2026-04-22：将 `project-121` 从阶段 handoff 骨架继续拆到 code implementation 粒度，补齐 `TK-1043` 到 `TK-1050` 的 service/client/extension/test 任务面。
4. 2026-04-22：按 `workspace-scoped-cr-loop` 激活 `sprint-001-direct-hitl-and-runtime-lanes-baseline`，执行顺序固定为 sprint-001 -> sprint-002 -> sprint-003 -> project-final CR -> closeout。
5. 2026-04-22：`CR-018` 已完成 fresh clean recheck，`TK-1038 / DA-1038` 已完成 sprint-001 closeout write-back；`current-context` 已切换到 `sprint-002` 作为新的 primary execution surface，`sprint-003` 保持 planned follow-up。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary
