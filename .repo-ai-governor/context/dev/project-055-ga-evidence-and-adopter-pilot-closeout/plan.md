# project-055-ga-evidence-and-adopter-pilot-closeout 计划

- Status: active
- Date: 2026-04-06
- Stage Mapping: GA evidence consolidation and pilot rehearsal
- Phase Mapping: pilot selection / pilot execution / evidence consolidation
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 用真实目标仓库验证 adopter path。
2. 固化 timing evidence、升级迁移/回滚演练与 GA closeout 证据。
3. 让“我们相信已经可以用”变成“我们有结构化证据证明可以用”。

## 2. Sprint 细化

## 2.1 sprint-001-real-target-repo-adopter-pilot

- Status: completed
- Sprint Goal: 选择真实目标仓库并完成 adopter rehearsal。
- Task Package: `TK-613`、`TK-614`、`TK-615`。

## 2.2 sprint-002-ga-evidence-consolidation-and-closeout

- Status: active
- Sprint Goal: 将 pilot、timing、support matrix 与 maintainer evidence 汇总为统一 closeout 结论。
- Task Package: `TK-616`、`TK-617`、`TK-644`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-613 | sprint-001 | freeze adopter pilot repository selection and acceptance rubric | pilot/contract | project-052、053 recommended | completed |
| TK-614 | sprint-001 | execute pilot-1 install init doctor check verify dry-run rehearsal with timing evidence | pilot/execution | TK-613 | completed |
| TK-615 | sprint-001 | execute pilot-2 upgrade workspace migration rollback rehearsal and capture delta findings | pilot/execution | TK-613 | completed |
| TK-616 | sprint-002 | consolidate support matrix GA evidence and maintainer validation outputs into one dossier | evidence/docs | TK-614、TK-615 | completed |
| TK-617 | sprint-002 | close project-055 with GA readiness recommendation blockers and next-step decision memo | project/closeout | TK-616 | completed |
| TK-644 | sprint-002 | sprint-002 exit acceptance and project-final review handoff | sprint/closeout | TK-616、TK-617、CR-001 | completed |

## 4. 依赖产物策略

1. pilot rehearsal 默认建立在 `project-052` 与 `project-053` 已经形成稳定 truth 后进行。
2. 先冻结 pilot 仓库选择与 acceptance rubric，再执行两类 rehearsal，避免证据不可比。
3. `sprint-002` 的 GA closeout 只消费已完成的 pilot/timing evidence，不重新定义产品边界。

## 5. DoD（project-055）

1. 至少 1 到 2 个真实目标仓库完成 adopter rehearsal。
2. 有统一 timing evidence 与失败分类。
3. 可产出一份明确的 GA readiness recommendation，而不是分散判断。

## 6. 里程碑记录

1. 2026-04-06：基于 `DA-588` 创建 `project-055` planned stream，作为 GA evidence consolidation follow-up。
2. 2026-04-06：已写入 `sprint-001 ~ sprint-002` 与 `TK-613 ~ TK-617` skeleton，待后续按顺序激活。
3. 2026-04-07：`project-054` final closeout 完成后，`project-055 / sprint-001` 被激活为当前 primary stream，`TK-613` 已切换为 `in_progress`。
4. 2026-04-07：`TK-613 / DA-613` 已完成 pilot 仓库与 acceptance rubric 冻结；`TK-614` 已切换为 `in_progress`，开始 `playground` 的 simple pilot rehearsal。
5. 2026-04-07：`TK-615` 已切换为 `in_progress`，开始在 `react-native-image-marker-1.1.x` 上执行 complex pilot rehearsal。
6. 2026-04-07：`TK-614 / DA-614` 与 `TK-615 / DA-615` 已完成两条 adopter rehearsal；`sprint-001` 实现边界已结束，下一步进入 sprint-scoped CR loop。
7. 2026-04-07：`CR-001` 已 resolved，`TK-643 / DA-643` 已完成 sprint-001 closeout，并激活 `sprint-002 / TK-616`。
8. 2026-04-07：`TK-616 / DA-616` 已完成 real-target pilot dossier、support-matrix / maintainer-playbook / GA-evidence backlink 对齐；`TK-617 / DA-617` 已生成 prepared completion audit summary 与 `project-057 -> project-056` next-step recommendation，下一步进入 `sprint-002` scoped CR loop。
9. 2026-04-07：`CR-001` 已 resolved，`TK-644 / DA-644` 已完成 sprint-002 exit acceptance 与 project-final review handoff；当前下一边界固定为 `project-055` project-final scoped CR loop。
