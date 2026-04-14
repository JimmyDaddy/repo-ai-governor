# project-102-cli-exec-launch-authoring-contract-tests-rollout 计划

- Status: active
- Date: 2026-04-14
- Stage Mapping: cli_exec launch-authoring contract-tests rollout
- Phase Mapping: shared harness baseline / probe-invoke preserved-fact split / failure-path coverage and closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. 目标

1. 将 `technical-solution.cli-exec-adapter-launch-authoring-contract-tests` 从 formal direction 推进到真实的 shared harness rollout。
2. 在不吞并 adapter authoring truth 的前提下，补齐 probe/invoke preserved-fact split、fallback entrypoint projection 与 failure-path contract coverage。
3. 保持 compatibility baseline 与 launch-authoring ownership guardrail 对齐，同时不把本项目扩成全量 adapter test strategy。

## 2. Sprint 细化

## 2.1 sprint-001-launch-authoring-contract-tests-rollout

- Status: completed
- Sprint Goal: 初始化 shared launch-authoring contract-test rollout baseline，并冻结第一阶段 implementation boundary。
- Task Package: `TK-857`、`TK-867`、`TK-868`

## 2.2 sprint-002-failure-path-coverage-and-rollout-closeout

- Status: active
- Sprint Goal: 扩展 failure-path coverage，完成 compatibility-aligned evidence 与 rollout closeout。
- Task Package: `TK-869`、`TK-870`、`TK-871`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-857 | sprint-001 | implement cli-exec launch authoring contract tests rollout baseline | rollout/planned | DA-846 | completed |
| TK-867 | sprint-001 | split probe invoke preserved-fact assertions and fallback entrypoint projection coverage onto the shared harness | harness/ownership | TK-857 | completed |
| TK-868 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-857、TK-867、activation-time local CR-001 | completed |
| TK-869 | sprint-002 | extend launch-authoring contract coverage across spawn parse non-zero signal timeout and abort paths | coverage/failure-path | TK-868 | in_progress |
| TK-870 | sprint-002 | prove compatibility-baseline alignment without widening scope into general adapter test strategy | evidence/alignment | TK-869 | planned |
| TK-871 | sprint-002 | finalize project-102 closeout and delivery evidence handoff | closeout/delivery | TK-869、TK-870、activation-time local CR-001 | planned |

## 4. 依赖产物策略

1. 必须先消费 `DA-846` 与 active launch-authoring ADR，再进入任何 shared harness implementation。
2. 推荐在 `project-106` compatibility baseline 起步后再激活 `project-102`，避免 ownership guardrail 脱离 compatibility taxonomy 单独演化。
3. `sprint-001` 只处理 shared harness、probe/invoke split 与 fallback projection；`sprint-002` 才承接 full failure-path coverage 与 closeout。
4. 本次 decomposition 不预创建 `CR-xxx` task card；每个 sprint 激活后必须先预留本地 `CR-001` 并走 `workspace-scoped-cr-loop`。

## 5. DoD（project-102）

1. `project-102` 已激活为当前 primary execution stream，并开始推进 `sprint-001` 的 shared harness baseline。
2. shared harness、fallback entrypoint projection 与 failure-path coverage 的 implementation boundary 已完整落到 task package。
3. rollout 不得把 probe / invoke preserved facts 与 adapter-owned authoring truth 混淆，也不得扩面成 general adapter test strategy。

## 6. 里程碑记录

1. 2026-04-13：由 `project-101 / TK-846` promotion cutover 创建为 planned follow-up stream。
2. 2026-04-14：`project-102` 已扩展为两阶段 execution-ready scaffold，并与 `project-106` 的推荐前置顺序对齐。
3. 2026-04-14：`project-106` final closeout 完成后，当前 project 已切换为 active，并将 `sprint-001` 激活为新的 primary implementation surface。
4. 2026-04-14：`TK-857` 与 `TK-867` 已完成 shared launch-authoring harness baseline、probe/invoke split 与 fallback entrypoint projection coverage，当前 `sprint-001` implementation boundary 等待 `CR-001` fresh reviewer round。
5. 2026-04-14：`CR-001` clean recheck 未发现新的 actionable finding；`sprint-001` 已完成 closeout 并切换到 `sprint-002`，当前开始 failure-path coverage implementation。
6. 2026-04-14：`sprint-002` implementation boundary 已完成 failure-path launch truth backfill与 compatibility alignment evidence；`CR-001` 因两次 fresh reviewer timeout 改走 main-agent clean recheck fallback 收口为 `resolved`，当前准备进入 project-final review。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
