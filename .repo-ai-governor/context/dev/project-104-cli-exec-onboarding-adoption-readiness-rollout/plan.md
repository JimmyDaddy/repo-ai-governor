# project-104-cli-exec-onboarding-adoption-readiness-rollout 计划

- Status: active
- Date: 2026-04-14
- Stage Mapping: cli_exec onboarding and adoption readiness rollout
- Phase Mapping: readiness composition baseline / playbook readback and support evidence prep / rollout closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. 目标

1. 将 `technical-solution.cli-exec-onboarding-and-adoption-readiness-productization` 从 formal direction 推进到真实 rollout。
2. 在不引入新 minimum fields、也不提前 uplift public support wording 的前提下，把 `connect / doctor / verify` readiness evidence chain 落到 adopter-facing guidance 和 local adoption readback。
3. 保持 readiness composition 与 upstream diagnostics consumer truth 对齐，而不让 playbook/support wording 反向成为新的 runtime truth source。

## 2. Sprint 细化

## 2.1 sprint-001-onboarding-adoption-readiness-rollout

- Status: completed
- Sprint Goal: 初始化 onboarding/adoption readiness rollout baseline，并冻结第一阶段 implementation boundary。
- Task Package: `TK-859`、`TK-877`、`TK-878`

## 2.2 sprint-002-playbook-readback-and-support-evidence-prep

- Status: active
- Sprint Goal: 推进 playbook readback、support evidence preparation，并完成 rollout closeout。
- Task Package: `TK-879`、`TK-880`、`TK-881`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-859 | sprint-001 | implement cli-exec onboarding and adoption readiness rollout baseline | rollout/planned | DA-852 | completed |
| TK-877 | sprint-001 | compose verification_status diagnostic_summary and next_action(s) from canonical onboarding probe truth | readiness/composition | TK-859 | completed |
| TK-878 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-859、TK-877、activation-time local CR-001 | completed |
| TK-879 | sprint-002 | apply the readiness evidence chain to local adoption readback and playbook-consumer surfaces | docs/readback | TK-878 | in_progress |
| TK-880 | sprint-002 | prepare support-evidence package and guardrails without uplifting support-matrix truth by default | support/evidence | TK-879 | planned |
| TK-881 | sprint-002 | finalize project-104 closeout and delivery evidence handoff | closeout/delivery | TK-879、TK-880、activation-time local CR-001 | planned |

## 4. 依赖产物策略

1. 必须先消费 `DA-852` 与 active onboarding/adoption ADR，再进入任何 adopter-facing rollout。
2. 推荐在 `project-103` diagnostics consumer truth 起步后再激活 `project-104`，避免 readiness composition 脱离 machine-readable diagnostics。
3. `sprint-001` 只处理 readiness composition baseline；`sprint-002` 才承接 playbook readback、support evidence 与 closeout。
4. 本次 decomposition 不预创建 `CR-xxx` task card；每个 sprint 激活后必须先预留本地 `CR-001` 并走 `workspace-scoped-cr-loop`。

## 5. DoD（project-104）

1. `project-104` 已扩展为两阶段 execution-ready scaffold，并保持 `planned` 状态等待显式激活。
2. readiness composition、playbook readback 与 support-evidence prep 的 implementation boundary 已完整落到 task package。
3. rollout 不得把 onboarding/probe additive clarification 升格为新的 minimum fields，也不得提前把 playbook/support wording 当作已完成 public truth。

## 6. 里程碑记录

1. 2026-04-13：由 `project-101 / TK-852` promotion cutover 创建为 planned follow-up stream。
2. 2026-04-14：`project-104` 已扩展为两阶段 execution-ready scaffold，并与 `project-103` 的推荐前置顺序对齐。
3. 2026-04-14：`project-103` final closeout 完成后，当前 project 已切换为 active，并将 `sprint-001` 激活为新的 primary implementation surface。
4. 2026-04-14：`sprint-001` 已在 `CR-001` finding round + `CR-002` clean recheck 后完成 closeout，并将 `sprint-002` 激活为新的 primary execution surface。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
