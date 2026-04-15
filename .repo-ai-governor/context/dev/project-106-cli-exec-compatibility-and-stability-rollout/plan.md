# project-106-cli-exec-compatibility-and-stability-rollout 计划

- Status: completed
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

- Status: completed
- Sprint Goal: 建立 native `cli_exec` scenario-class compatibility harness 与 preserved-facts assertions。
- Task Package: `TK-861`、`TK-862`、`TK-863`

## 2.2 sprint-002-verification-profiles-trigger-matrix-and-closeout

- Status: completed
- Sprint Goal: 补齐 focused compatibility verification profile、trigger matrix 与 rollout closeout guidance。
- Task Package: `TK-864`、`TK-865`、`TK-866`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-861 | sprint-001 | establish native cli_exec scenario-class compatibility harness and preserved-facts assertions | runtime/compatibility | DA-842 | completed |
| TK-862 | sprint-001 | align codex claude-code github-copilot smoke plus onboarding routing tests to the compatibility taxonomy | adapter/evidence | TK-861 | completed |
| TK-863 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-861、TK-862、activation-time local CR-001 | completed |
| TK-864 | sprint-002 | wire focused compatibility verification profiles and trigger-matrix routing without promoting them to governance gates | verification/profile | TK-863 | completed |
| TK-865 | sprint-002 | capture compatibility baseline evidence pack and closeout guidance for future runtime windows | evidence/closeout | TK-864 | completed |
| TK-866 | sprint-002 | finalize project-106 closeout and delivery evidence handoff | closeout/delivery | TK-864、TK-865、activation-time local CR-001 | completed |

## 4. 依赖产物策略

1. `project-106` 作为 5 方向 rollout 的推荐起点，先收敛 compatibility taxonomy 与 regression harness，再激活 `project-102 ~ project-105`。
2. `sprint-001` 只固定 scenario class、preserved facts 与 cross-adapter smoke/onboarding/routing coverage，不提前把 profile routing 写成新的 gate truth。
3. `sprint-002` 只 formalize rollout-owned verification usage 与 closeout guidance；compatibility profiles 继续属于 runtime guidance，不升级为 `governance.execution-gates`。
4. 本次 decomposition 不预创建 `CR-xxx` task card；每个 sprint 激活后必须先预留本地 `CR-001` 并走 `workspace-scoped-cr-loop`。

## 5. DoD（project-106）

1. `project-106` 已完成 preflight baseline、`sprint-001` compatibility harness、`sprint-002` verification profile / trigger matrix implementation，并在 latest sprint clean recheck 与 project-final clean recheck 后收口为 `completed`。
2. `technical-solution.cli-exec-compatibility-and-stability-productization` 的 delivery truth 已切到 `execution_status=completed`、`rollout_status=not_required`，并回链 project completion audit、DA-842 promotion handoff 与本项目 closeout evidence。
3. `current-context.md` 已将 `stream-project-106-sprint-002` 迁入 completed history，并激活 `stream-project-102-sprint-001` 作为新的 primary stream，同时保留后续 `project-103 ~ project-105` 的 planned order。

## 6. 里程碑记录

1. 2026-04-14：创建 `project-106` 与 `sprint-001 ~ sprint-002`，承接 cli_exec compatibility/stability rollout decomposition。
2. 2026-04-14：`TK-861 ~ TK-866` 已写入 execution-ready task package，并与 delivery/current-context 真值同步。
3. 2026-04-14：preflight baseline 以 `d0b66f35` checkpoint commit 收口后，正式激活 `sprint-001` 进入 implementation + CR loop 窗口。
4. 2026-04-14：`sprint-001` 已完成 compatibility harness 与 cross-adapter baseline 收口，并在 clean reviewer recheck 后切换到 `sprint-002` primary surface。
5. 2026-04-14：`sprint-002` implementation boundary 已在 `CR-011` clean recheck 后达到 closeout-ready，下一步在同一 surface 上执行 project-final fresh review 与 `TK-866`。
6. 2026-04-14：project-final `CR-012` 暴露 project plan DoD / current-context note 仍停留在 bootstrap truth；当前已进入 docs/ledger drift 修复并等待新的 clean recheck。
7. 2026-04-14：native `cli_exec` timeout/abort partial-output preservation 的 full-gate flake 已通过 focused stabilization、`pnpm run build` 与 `pnpm run check` 重新转绿；当前继续保留 `project-106` 为 active closeout surface，并等待 latest fresh clean recheck 结论后再执行最终 closeout。
8. 2026-04-14：project-final `CR-020` latest fresh clean recheck 未发现新的 actionable finding；当前已完成 project-106 final closeout、completion audit write-back 与 compatibility delivery execution completion，并切换到 `project-102 / sprint-001` 继续后续 rollout 顺序。

## 7. 里程碑记录入口

1. `./project-106-cli-exec-compatibility-and-stability-rollout-completion-audit-summary.md`
