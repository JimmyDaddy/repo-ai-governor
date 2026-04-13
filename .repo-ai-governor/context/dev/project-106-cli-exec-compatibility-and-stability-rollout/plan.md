# project-106-cli-exec-compatibility-and-stability-rollout 计划

- Status: planned
- Date: 2026-04-14
- Stage Mapping: cli_exec compatibility and stability rollout
- Phase Mapping: compatibility taxonomy and regression harness / verification profiles and trigger matrix / rollout closeout guidance
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
  - `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/tasks/DA-842-cli-exec-compatibility-and-stability-promotion-cutover.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. 目标

1. 将 `technical-solution.cli-exec-compatibility-and-stability-productization` 从 formal runtime guidance 推进到真实 rollout project。
2. 建立 native `cli_exec` scenario-class compatibility taxonomy、preserved-facts regression harness 与 cross-adapter evidence baseline。
3. 在不把 compatibility profiles 升格为 `governance.execution-gates` formal truth 的前提下，补齐 focused verification profile、trigger matrix 与 closeout guidance。

## 2. Sprint 细化

## 2.1 sprint-001-compatibility-taxonomy-and-regression-harness

- Status: planned
- Sprint Goal: 建立 native `cli_exec` scenario-class compatibility harness 与 preserved-facts assertions。
- Task Package: `TK-861`、`TK-862`、`TK-863`

## 2.2 sprint-002-verification-profiles-trigger-matrix-and-closeout

- Status: planned
- Sprint Goal: 补齐 focused compatibility verification profile、trigger matrix 与 rollout closeout guidance。
- Task Package: `TK-864`、`TK-865`、`TK-866`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-861 | sprint-001 | establish native cli_exec scenario-class compatibility harness and preserved-facts assertions | runtime/compatibility | DA-842 | planned |
| TK-862 | sprint-001 | align codex claude-code github-copilot smoke plus onboarding routing tests to the compatibility taxonomy | adapter/evidence | TK-861 | planned |
| TK-863 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-861、TK-862、activation-time local CR-001 | planned |
| TK-864 | sprint-002 | wire focused compatibility verification profiles and trigger-matrix routing without promoting them to governance gates | verification/profile | TK-863 | planned |
| TK-865 | sprint-002 | capture compatibility baseline evidence pack and closeout guidance for future runtime windows | evidence/closeout | TK-864 | planned |
| TK-866 | sprint-002 | finalize project-106 closeout and delivery evidence handoff | closeout/delivery | TK-864、TK-865、activation-time local CR-001 | planned |

## 4. 依赖产物策略

1. `project-106` 作为 5 方向 rollout 的推荐起点，先收敛 compatibility taxonomy 与 regression harness，再激活 `project-102 ~ project-105`。
2. `sprint-001` 只固定 scenario class、preserved facts 与 cross-adapter smoke/onboarding/routing coverage，不提前把 profile routing 写成新的 gate truth。
3. `sprint-002` 只 formalize rollout-owned verification usage 与 closeout guidance；compatibility profiles 继续属于 runtime guidance，不升级为 `governance.execution-gates`。
4. 本次 decomposition 不预创建 `CR-xxx` task card；每个 sprint 激活后必须先预留本地 `CR-001` 并走 `workspace-scoped-cr-loop`。

## 5. DoD（project-106）

1. `project-106` 已以两阶段 execution-ready scaffold 落地，并保持 `planned` 状态等待显式激活。
2. compatibility/stability solution 的 delivery truth 已切到真实 follow-up rollout ownership。
3. `current-context.md` 已把 `project-106` 挂为第一条 planned follow-up stream，且后续 `project-102 ~ project-105` 保持推荐顺序可见。

## 6. 里程碑记录

1. 2026-04-14：创建 `project-106` 与 `sprint-001 ~ sprint-002`，承接 cli_exec compatibility/stability rollout decomposition。
2. 2026-04-14：`TK-861 ~ TK-866` 已写入 execution-ready task package，并与 delivery/current-context 真值同步。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
