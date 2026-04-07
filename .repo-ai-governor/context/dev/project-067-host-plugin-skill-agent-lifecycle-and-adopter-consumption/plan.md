# project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: formal host-native lifecycle follow-up
- Phase Mapping: Codex / Claude Code plugin-skill-agent lifecycle + support-truth + adopter consumption
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
  - `.repo-ai-governor/context/dev/project-070-host-plugin-skill-agent-triad-sync/plan.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 1. 目标

1. 为已完成 baseline 的 Codex / Claude Code host-native assets 补齐后续生命周期承载位。
2. 把 `.codex-plugin`、`.claude-plugin`、`.codex/skills`、`.claude/skills`、Codex subagents、Claude hooks / MCP 等能力推进到“可升级、可验证、可对外解释”的 follow-up 轨道。
3. 避免未来所有 host follow-up 都只能被迫挂到 reserved target backlog 下。

## 2. Sprint 细化

## 2.1 sprint-001-codex-claude-host-ergonomics-lifecycle-and-upgrade

- Status: completed
- Sprint Goal: 为 Codex / Claude Code plugin / skill / agent 资产冻结 lifecycle、upgrade、support-truth 与 adopter-consumption contract。
- Task Package: `TK-679`、`TK-680`、`TK-681`、`TK-702`、`TK-703`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-679 | sprint-001 | freeze codex claude host asset lifecycle and support-truth contract | host/contract | project-050 closeout + project-070 triad sync + project-063 recommended | completed |
| TK-680 | sprint-001 | implement codex claude host asset apply verify upgrade and adopter-consumption follow-up | host/implementation/docs | TK-679 | completed |
| TK-681 | sprint-001 | close codex claude host ergonomics follow-up with README support-matrix playbook and packaging evidence refresh | host/closeout | TK-679、TK-680 | completed |
| TK-702 | sprint-001 | sprint-001 exit acceptance and project-final review activation handoff | closeout/handoff | TK-679、TK-680、TK-681、CR-004 | completed |
| TK-703 | sprint-001 | finalize project-067 closeout and activate project-064 primary stream | closeout/final-audit | TK-702、CR-005 | completed |

## 4. 依赖产物策略

1. 先冻结 lifecycle / support-truth，再推进 apply / verify / upgrade 与 adopter consumption。
2. closeout 必须把 README、support matrix、playbook 与 target-specific evidence 收到一条 narrative 上。
3. sprint closeout 之后继续复用同一 sprint surface 打开 `project-067` project-final CR loop。

## 5. DoD（project-067）

1. Codex / Claude Code plugin / skill / agent 不再只是“生成过一次”的 baseline 资产，而有明确 lifecycle / upgrade / support-truth 约束。
2. adopter 若要消费这些 host assets，有清晰的 apply / verify / upgrade narrative。
3. `README`、support matrix、playbook 与 target-specific export / verify evidence 至少形成一条一致 narrative。

## 6. 里程碑记录

1. 2026-04-08：作为 `project-072` follow-up decomposition 产物创建，当前保持 `planned`。
2. 2026-04-08：`project-063` final closeout 完成后被激活为当前 primary project，`sprint-001 / TK-679` 进入执行窗口。
3. 2026-04-08：`TK-679 ~ TK-681` 已完成实现与文档/evidence 收口，当前等待 sprint-level CR loop、closeout 与本地边界 commit。
4. 2026-04-08：`CR-004` clean `resolved`；`TK-702 / DA-702` 已把 `sprint-001` 收口为 project-final-ready surface，当前下一边界固定为 `project-067` project-final delegated CR loop。
5. 2026-04-08：`CR-005` clean `resolved`；`TK-703 / DA-703` 已完成 final closeout write-back，并激活 `project-064 / sprint-001 / TK-670`；项目完成态审计摘要已落盘：`.repo-ai-governor/context/dev/project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption/project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption-completion-audit-summary.md`。
