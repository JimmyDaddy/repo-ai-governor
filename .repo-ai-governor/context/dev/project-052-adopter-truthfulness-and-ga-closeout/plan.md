# project-052-adopter-truthfulness-and-ga-closeout 计划

- Status: active
- Date: 2026-04-06
- Stage Mapping: adopter truthfulness and GA closeout
- Phase Mapping: install truth / upgrade and workspace UX / GA support evidence
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 把当前 CLI primary surface 的 adopter-facing 真值收口为更稳定的产品叙事。
2. 对齐 install mode、workspace migration、upgrade/rollback、support matrix 与 maintainer evidence。
3. 为后续 real adapter invocation、secondary surface 与 GA evidence 建立更稳的 adopter 基线。

## 2. Sprint 细化

## 2.1 sprint-001-install-mode-truth-and-playbook-alignment

- Status: completed
- Sprint Goal: 收紧 `path / link / dist-binary / tgz` 的支持口径，并对齐 README / local adoption / support matrix。
- Task Package: `TK-589`、`TK-590`、`TK-591`、`TK-636`。

## 2.2 sprint-002-upgrade-workspace-ux-and-rollback-closeout

- Status: active
- Sprint Goal: 把 `upgrade` 与 `workspace dry-run/execute/rollback` 的 adopter 用户路径真正收口。
- Task Package: `TK-592`、`TK-593`、`TK-594`。

## 2.3 sprint-003-ga-support-truthfulness-and-closeout-evidence

- Status: planned
- Sprint Goal: 将 support matrix、maintainer playbook、clean-room/release evidence 汇总成统一 closeout truth。
- Task Package: `TK-595`、`TK-596`、`TK-597`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-589 | sprint-001 | freeze adopter install mode support matrix and acceptance contract | contract/docs | DA-588 | completed |
| TK-590 | sprint-001 | align README local adoption playbook and support matrix install-mode truth | docs/alignment | TK-589 | completed |
| TK-591 | sprint-001 | close install-mode truthfulness with clean-room and dist-binary rehearsal evidence | acceptance/evidence | TK-589、TK-590 | completed |
| TK-636 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | closeout/handoff | TK-589、TK-590、TK-591、CR-001、CR-002 | completed |
| TK-592 | sprint-002 | freeze upgrade workspace migration rollback user-path contract | contract/ux | TK-591、TK-636 | in_progress |
| TK-593 | sprint-002 | implement and document upgrade preview apply rollback plus workspace migration closeout path | implementation/docs | TK-592 | planned |
| TK-594 | sprint-002 | close adopter-facing upgrade and workspace UX with troubleshooting acceptance | closeout/acceptance | TK-592、TK-593 | planned |
| TK-595 | sprint-003 | freeze GA support truthfulness evidence schema and maintainer cross-link contract | contract/evidence | TK-594 | planned |
| TK-596 | sprint-003 | consolidate support matrix maintainer validation and release evidence into one truth surface | docs/evidence | TK-595 | planned |
| TK-597 | sprint-003 | close project-052 with adopter truthfulness audit summary and next-stream recommendation | project/closeout | TK-595、TK-596 | planned |

## 4. 依赖产物策略

1. `sprint-001` 必须先收口 install mode truth，再进入 upgrade 与 workspace 体验收口。
2. `sprint-002` 的 adopter-facing UX 只能建立在 `sprint-001` 的支持矩阵与使用口径之上。
3. `sprint-003` 的 GA evidence consolidation 只在前两个 sprint 形成稳定 truth 后启动，避免重复修订证据。
4. 本项目结束前，不主动并发推进 `project-053` 以上的实现 stream。

## 5. DoD（project-052）

1. adopter 能明确知道哪条安装方式是首选，哪条仍有边界。
2. `upgrade / workspace migration / rollback` 在 adopter 文档中形成可操作路径。
3. support matrix 与 maintainer validation playbook 口径一致。
4. 至少一轮 clean-room / dist-binary / release evidence 被收敛到统一 closeout 结论。

## 6. 里程碑记录

1. 2026-04-06：基于 `DA-588` 创建 `project-052` planned stream，作为 priority roadmap 的第一条实现主线。
2. 2026-04-06：已写入 `sprint-001 ~ sprint-003` 与 `TK-589 ~ TK-597` skeleton，待后续窗口按顺序激活。
3. 2026-04-06：`project-052 / sprint-001` 被激活为当前 primary implementation stream，开始收口 adopter install-mode truth。
4. 2026-04-06：`TK-589 ~ TK-591` 的 install-mode 文档与证据实现面已完成，进入 `sprint-001` scoped CR loop。
5. 2026-04-06：`TK-636` 完成 sprint-001 closeout 与 sprint-002 activation handoff；`sprint-001` 已迁入 completed history，`sprint-002` 已激活且 `TK-592` 进入 `in_progress`。
