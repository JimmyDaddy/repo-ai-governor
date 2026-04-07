# project-063-packaged-distribution-and-install-surface-closeout 计划

- Status: planned
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

- Status: planned
- Sprint Goal: 明确 packaged install contract，并完成文档与 acceptance evidence 刷新。
- Task Package: `TK-667`、`TK-668`、`TK-669`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-667 | sprint-001 | freeze packaged install support contract and acceptance matrix | contract/docs | project-062 recommended | planned |
| TK-668 | sprint-001 | implement packaged installer runtime layout follow-up or explicit online-only boundary hardening | implementation/docs | TK-667 | planned |
| TK-669 | sprint-001 | close packaged adoption boundary with clean-room rehearsal and support-matrix refresh | acceptance/closeout | TK-667、TK-668 | planned |

## 4. 依赖产物策略

1. 先明确 packaged install contract，再决定补齐运行时布局还是强化 online-only boundary。
2. closeout 必须把 README、playbook、support matrix 与 clean-room evidence 对齐。

## 5. DoD（project-063）

1. adopter 能明确知道 packaged install 到底支持什么、不支持什么。
2. `README`、playbook、support matrix 与 clean-room evidence 一致。
3. 不再保留“看起来像支持，但实际上只做 rehearsal”的叙事漂移。
