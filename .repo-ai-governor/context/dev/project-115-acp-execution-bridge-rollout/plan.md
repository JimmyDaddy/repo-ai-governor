# project-115-acp-execution-bridge-rollout 计划

- Status: active
- Date: 2026-04-20
- Stage Mapping: runtime agent-projection rollout
- Phase Mapping: ACP execution bridge productization
- Upstream:
  - `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`

## 1. 目标

1. 将 acp_exec 从 readiness + host bootstrap 推进到真实可执行的 invoke/stream/confirm bridge。
2. 以 service-host/sidecar substrate 为基础完成 ACP execution bridge 的分阶段实现、证据收口与外部互操作验证。
3. 在不破坏 cli_exec canonical truth 的前提下，完成 acp_exec 的 execution-ready rollout decomposition。

## 2. Sprint 细化

## 2.1 sprint-001-contract-and-runtime-decomposition

- Status: completed
- Sprint Goal: 完成 ACP execution bridge 的 contract gap 收敛、runtime owner 拆分与 shared invocation model 基线
- Task Package: `TK-989、TK-990、TK-991`

## 2.2 sprint-002-executable-acp-exec-baseline

- Status: active
- Sprint Goal: 完成 session/new prompt cancel 主链路与 invoke/stream shared turn execution 基线
- Task Package: `TK-992、TK-993、TK-994`

## 2.3 sprint-003-permission-terminal-filesystem-bridge-hardening

- Status: planned
- Sprint Goal: 完成 permission terminal filesystem bridge hardening 与 capability-gated fail-closed 语义
- Task Package: `TK-995、TK-996、TK-997`

## 2.4 sprint-004-clean-room-execution-and-packaged-evidence

- Status: planned
- Sprint Goal: 完成 source-checkout packaged clean-room execution evidence 与 failure-path 验证
- Task Package: `TK-998、TK-999、TK-1000`

## 2.5 sprint-005-external-interoperability-and-rollout-closeout

- Status: planned
- Sprint Goal: 完成外部 ACP interoperability rehearsal、support 边界复核与 rollout closeout
- Task Package: `TK-1001、TK-1002、TK-1003`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-989 | sprint-001-contract-and-runtime-decomposition | freeze acp execution bridge runtime contract boundary | contract baseline | scaffold baseline | completed |
| TK-990 | sprint-001-contract-and-runtime-decomposition | decompose transport client session turn and host-operation runtimes | runtime decomposition | TK-989 | completed |
| TK-991 | sprint-001-contract-and-runtime-decomposition | prepare sprint-001 handoff and activation recommendation | governance handoff | TK-990 | completed |
| TK-992 | sprint-002-executable-acp-exec-baseline | implement executable acp_exec invoke prompt and cancel baseline | execution baseline | sprint-001-contract-and-runtime-decomposition planned handoff | in_progress |
| TK-993 | sprint-002-executable-acp-exec-baseline | land shared invocation store and stream attachment semantics | shared execution | TK-992 | planned |
| TK-994 | sprint-002-executable-acp-exec-baseline | verify fixture-backed acp contract baseline and sprint-002 handoff | verification handoff | TK-993 | planned |
| TK-995 | sprint-003-permission-terminal-filesystem-bridge-hardening | implement permission bridge and active tool-call confirmation mapping | permission bridge | sprint-002-executable-acp-exec-baseline planned handoff | planned |
| TK-996 | sprint-003-permission-terminal-filesystem-bridge-hardening | implement terminal and filesystem bridge runtime hardening | host operation bridge | TK-995 | planned |
| TK-997 | sprint-003-permission-terminal-filesystem-bridge-hardening | verify failure-path matrix and sprint-003 handoff | verification handoff | TK-996 | planned |
| TK-998 | sprint-004-clean-room-execution-and-packaged-evidence | build source-checkout acp execution clean-room slice | clean-room evidence | sprint-003-permission-terminal-filesystem-bridge-hardening planned handoff | planned |
| TK-999 | sprint-004-clean-room-execution-and-packaged-evidence | land packaged distribution and runtime-service execution evidence | distribution evidence | TK-998 | planned |
| TK-1000 | sprint-004-clean-room-execution-and-packaged-evidence | prepare sprint-004 closeout and support-truth readiness recommendation | closeout handoff | TK-999 | planned |
| TK-1001 | sprint-005-external-interoperability-and-rollout-closeout | run optional external acp interoperability rehearsal | interoperability rehearsal | sprint-004-clean-room-execution-and-packaged-evidence planned handoff | planned |
| TK-1002 | sprint-005-external-interoperability-and-rollout-closeout | review support wording uplift and rollout claim boundary | support truth review | TK-1001 | planned |
| TK-1003 | sprint-005-external-interoperability-and-rollout-closeout | close rollout project and publish completion audit | project closeout | TK-1002 | planned |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-115-acp-execution-bridge-rollout）

1. 5 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. 任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。
3. 在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。

## 6. 里程碑记录

1. 2026-04-20：创建 project-115-acp-execution-bridge-rollout 全量执行流骨架，覆盖 sprint-001-contract-and-runtime-decomposition、sprint-002-executable-acp-exec-baseline、sprint-003-permission-terminal-filesystem-bridge-hardening、sprint-004-clean-room-execution-and-packaged-evidence、sprint-005-external-interoperability-and-rollout-closeout。
2. 2026-04-20：完成 sprint-001 implementation baseline，固定 ACP runtime owner split、shared invocation state 基线与 sprint-002 activation recommendation，代码验证已通过 targeted runtime vitest、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`。
3. 2026-04-20：`CR-001` 已 resolved，sprint-001 正式完成并切换到 `sprint-002-executable-acp-exec-baseline`；`TK-992` 已激活为当前 in-progress execution surface。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
