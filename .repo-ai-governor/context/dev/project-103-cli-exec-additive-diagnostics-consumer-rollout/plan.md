# project-103-cli-exec-additive-diagnostics-consumer-rollout 计划

- Status: active
- Date: 2026-04-14
- Stage Mapping: cli_exec additive diagnostics consumer rollout
- Phase Mapping: consumer projection baseline / connect-doctor-verify-report adoption / rollout closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. 目标

1. 将 `technical-solution.cli-exec-additive-diagnostics-consumer-productization` 从 formal direction 推进到真实的 consumer projection rollout。
2. 在不升级 minimum contract、不改写 probe/invoke ownership 的前提下，让 `connect / doctor / verify / report` 稳定消费 machine-readable `launch_diagnostics`。
3. 保持 diagnostics consumer rollout 与 upstream launch-authoring/compatibility truth 对齐，而不回退到 stderr 文本猜测路径。

## 2. Sprint 细化

## 2.1 sprint-001-additive-diagnostics-consumer-rollout

- Status: active
- Sprint Goal: 初始化 launch diagnostics consumer projection rollout baseline，并冻结第一阶段 implementation boundary。
- Task Package: `TK-858`、`TK-872`、`TK-873`

## 2.2 sprint-002-consumer-surface-adoption-and-rollout-closeout

- Status: planned
- Sprint Goal: 推进 consumer surface adoption，补齐 scenario-driven evidence 并完成 rollout closeout。
- Task Package: `TK-874`、`TK-875`、`TK-876`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-858 | sprint-001 | implement cli-exec additive diagnostics consumer rollout baseline | rollout/planned | DA-849 | in_progress |
| TK-872 | sprint-001 | project snake_case launch_diagnostics companion from shared producer truth without adding minimum fields | projection/consumer | TK-858 | planned |
| TK-873 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-858、TK-872、activation-time local CR-001 | planned |
| TK-874 | sprint-002 | adopt launch_diagnostics across connect doctor verify and report surfaces and retire stderr-guess branches | surface/adoption | TK-873 | planned |
| TK-875 | sprint-002 | produce scenario-driven evidence for spawn-failed parse-failed non-zero and signal consumer mappings | evidence/scenario | TK-874 | planned |
| TK-876 | sprint-002 | finalize project-103 closeout and delivery evidence handoff | closeout/delivery | TK-874、TK-875、activation-time local CR-001 | planned |

## 4. 依赖产物策略

1. 必须先消费 `DA-849` 与 active diagnostics-consumer ADR，再进入任何 consumer rollout。
2. 推荐在 `project-102` launch-authoring ownership guardrail 起步后再激活 `project-103`，避免 consumer projection 与 producer truth 脱节。
3. `sprint-001` 只处理 snake_case companion projection；`sprint-002` 才承接 surface adoption、scenario evidence 与 closeout。
4. 本次 decomposition 不预创建 `CR-xxx` task card；每个 sprint 激活后必须先预留本地 `CR-001` 并走 `workspace-scoped-cr-loop`。

## 5. DoD（project-103）

1. `project-103` 已激活为当前 primary execution stream，并开始推进 `sprint-001` 的 diagnostics consumer baseline。
2. consumer projection、surface adoption 与 scenario evidence 的 implementation boundary 已完整落到 task package。
3. rollout 不得把 additive diagnostics 升格为新的 minimum fields，也不得重新回到 stderr/error-message 猜测路径。

## 6. 里程碑记录

1. 2026-04-13：由 `project-101 / TK-849` promotion cutover 创建为 planned follow-up stream。
2. 2026-04-14：`project-103` 已扩展为两阶段 execution-ready scaffold，并与 `project-102` 的推荐前置顺序对齐。
3. 2026-04-14：`project-102` final closeout 完成后，当前 project 已切换为 active，并将 `sprint-001` 激活为新的 primary implementation surface。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
