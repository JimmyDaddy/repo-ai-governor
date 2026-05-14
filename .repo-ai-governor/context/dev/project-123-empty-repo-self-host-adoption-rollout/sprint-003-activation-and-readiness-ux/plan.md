# sprint-003-activation-and-readiness-ux 计划

- Status: completed
- Date: 2026-05-13
- Sprint Goal: 引入 canonical self-host activation/readiness phase，并收敛 verify/doctor/check 的职责分层与提示面
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 1. Scope

1. 把 template_seeded/authoring_started/adapter_connected/execution_ready phase 接入 adopt verify 的 canonical verdict 与 verification summary。
2. 让 doctor 与 check 只消费 canonical phase truth，并补齐 additive diagnostics、blocked signal owner split 与 operator next-actions。
3. 为 sprint-004 固定 clean-room rehearsal 与 docs truthfulness closeout 的首跳输入。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1060 | implement canonical self-host activation phase and verification summary | close sprint-002 and hand off activation readiness work | completed |
| TK-1061 | align doctor and check additive readiness diagnostics and next actions | implement canonical self-host activation phase and verification summary | completed |
| TK-1062 | close sprint-003 and hand off clean-room truthfulness follow-through | align doctor and check additive readiness diagnostics and next actions | completed |

## 3. Exit Criteria

1. adopt verify、doctor、check 对 self-host readiness 的职责边界、phase truth 与 operator next-actions 已结构化并保持单一 canonical producer。
2. sprint-003 closeout handoff 已把 clean-room evidence 与 docs truthfulness follow-through 的执行输入收敛到 canonical task cards。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-002-ownership-and-generated-artifact-policy handoff 或用户显式激活。
4. 2026-05-14：`TK-1059 / DA-1059` 已将该 sprint 激活为 `project-123` 的 primary execution surface；`sprint-004` 保持 planned follow-up。
5. 2026-05-14：`TK-1060 / TK-1061` 已完成并通过 fresh reviewer round 1 修复闭环；随后 `CR-002 / CR-003` 修复 self-host readiness i18n 与 `check` locale-aware output 缺口，latest fresh reviewer round `CR-004` clean 后，`TK-1062` 已完成 sprint-003 closeout/handoff。
