# sprint-002-deprecated-compact-and-archive-integrity-automation 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint Goal: 打通 deprecated grace-window compaction、archive integrity gate 与 monthly audit enforcement。

## 1. Task Package

1. `TK-753` implement deprecated grace-window compaction command and dry-run report
2. `TK-754` add archive integrity gate and monthly audit enforcement
3. `TK-758` sprint-002 exit acceptance and sprint-003 handoff readiness

## 2. Exit Criteria

1. compact 命令支持 `dry-run`，并可识别超期 `deprecated` backlog。
2. archive integrity gate 能稳定校验 root/archive manifest 的不重叠约束。
3. monthly audit 已纳入 normative-loading lifecycle 的常规运维入口。

## 3. Milestones

1. 2026-04-11：创建 `sprint-002-deprecated-compact-and-archive-integrity-automation` 作为 sprint-001 之后的 follow-through phase。
2. 2026-04-11：`TK-757 / DA-757` 已完成 sprint-001 handoff，`sprint-002` 切换为 active primary implementation stream。
3. 2026-04-11：`TK-753 / TK-754` 已完成 compaction tooling、archive integrity gate、monthly audit docs 与验证，当前进入 fresh delegated CR loop。
4. 2026-04-11：`CR-001` 已 clean 收口，`TK-758 / DA-758` 已完成 sprint exit acceptance 与 sprint-003 handoff，sprint-002 收口为 `completed`。
