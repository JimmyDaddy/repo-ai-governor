# project-063-packaged-distribution-and-install-surface-closeout 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: adopter distribution truth refresh
- Phase Mapping: packaged install contract + clean-room acceptance
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 1. 目标

1. 收口 `tgz` / packaged install 的正式支持边界。
2. 决定是维持 `online packaged rehearsal`，还是补齐更完整的 packaged adopter delivery。
3. 将 install-mode narrative、support matrix 与 clean-room evidence 拉齐。

## 2. Sprint 细化

## 2.1 sprint-001-packaged-install-contract-and-acceptance-refresh

- Status: completed
- Sprint Goal: 明确 packaged install contract，并完成文档与 acceptance evidence 刷新。
- Task Package: `TK-667`、`TK-668`、`TK-669`、`TK-700`、`TK-701`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-667 | sprint-001 | freeze packaged install support contract and acceptance matrix | contract/docs | project-062 recommended | completed |
| TK-668 | sprint-001 | implement packaged installer runtime layout follow-up or explicit online-only boundary hardening | implementation/docs | TK-667 | completed |
| TK-669 | sprint-001 | close packaged adoption boundary with clean-room rehearsal and support-matrix refresh | acceptance/closeout | TK-667、TK-668 | completed |
| TK-700 | sprint-001 | sprint-001 exit acceptance and project-final review activation handoff | closeout/handoff | TK-667、TK-668、TK-669、CR-001 | completed |
| TK-701 | sprint-001 | finalize project-063 closeout and activate project-067 primary stream | closeout/final-audit | TK-700、CR-002 | completed |

## 4. 依赖产物策略

1. 先明确 packaged install contract，再决定补齐运行时布局还是强化 online-only boundary。
2. closeout 必须把 README、playbook、support matrix 与 clean-room evidence 对齐。
3. sprint closeout 之后继续复用同一 sprint surface 打开 `project-063` project-final CR loop。

## 5. DoD（project-063）

1. adopter 能明确知道 packaged install 到底支持什么、不支持什么。
2. `README`、playbook、support matrix 与 clean-room evidence 一致。
3. 不再保留“看起来像支持，但实际上只做 rehearsal”的叙事漂移。

## 6. 里程碑记录

1. 2026-04-08：作为 `project-072` follow-up decomposition 产物创建，当前保持 `planned`。
2. 2026-04-08：`project-062` final closeout 完成后被激活为当前 primary project，`sprint-001 / TK-667` 进入执行窗口。
3. 2026-04-08：`TK-667 / TK-668 / TK-669` 已完成 packaged install contract freeze、runtime truth hardening、clean-room `tgz` evidence 与 support-matrix refresh；当前下一边界进入 `project-063` sprint-scoped delegated CR loop。
4. 2026-04-08：`CR-001` clean `resolved`；`TK-700 / DA-700` 已把 `sprint-001` 收口为 project-final-ready surface，当前下一边界固定为 `project-063` project-final delegated CR loop。
5. 2026-04-08：`CR-002` clean `resolved`；`TK-701 / DA-701` 已完成 final closeout write-back，并激活 `project-067 / sprint-001 / TK-679`；项目完成态审计摘要已落盘：`.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/project-063-packaged-distribution-and-install-surface-closeout-completion-audit-summary.md`。
