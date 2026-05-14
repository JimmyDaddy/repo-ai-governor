# project-124-empty-repo-self-host-readiness-follow-up 计划

- Status: completed
- Date: 2026-05-14
- Stage Mapping: runtime remediation
- Phase Mapping: self-host readiness gating and operator DX
- Upstream:
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-field-retrospective.md`
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1063-empty-repo-self-host-clean-room-evidence-and-operator-path-truth.md`

## 1. 目标

1. 修复 self-host readiness blocked truth 与 run 行为冲突，并收口 clean-room/operator guidance。
2. 逐条修复实地采用暴露的 runtime、CLI 与 docs 问题，并保留正式 closeout 证据链。

## 2. Sprint 细化

## 2.1 sprint-001-readiness-runtime-and-clean-room-dx

- Status: completed
- Sprint Goal: 修复 self-host readiness/run gating、connect/apply/verify 提示面与 clean-room guidance truth
- Task Package: `TK-1065、TK-1066、TK-1067`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1065 | sprint-001-readiness-runtime-and-clean-room-dx | fix self-host readiness preflight and run gating contract | runtime/gating | project-123 follow-up | completed |
| TK-1066 | sprint-001-readiness-runtime-and-clean-room-dx | improve self-host operator guidance and clean-room diagnostics wording | cli/docs | fix self-host readiness preflight and run gating contract | completed |
| TK-1067 | sprint-001-readiness-runtime-and-clean-room-dx | close sprint-001 and capture follow-up validation summary | governance/closeout | improve self-host operator guidance and clean-room diagnostics wording | completed |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-124-empty-repo-self-host-readiness-follow-up）

1. 1 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review artifacts 已全部收口到 completed truth。
2. self-host readiness blocked truth、run gating、canonical doctor replay、operator guidance 与 clean-room docs wording 已在 real-target evidence 窗口内完成修复。
3. completion audit summary、`DA-1067`、`current-context.md` idle 恢复与 completed-stream history 迁移已全部落盘。

## 6. 里程碑记录

1. 2026-05-14：创建 project-124-empty-repo-self-host-readiness-follow-up 全量执行流骨架，覆盖 sprint-001-readiness-runtime-and-clean-room-dx。
2. 2026-05-14：`TK-1065` 已修复 self-host readiness blocked truth 与 run preflight contract；`TK-1066` 已收口 operator guidance、doctor canonical replay 与 clean-room guidance wording，当前进入 `TK-1067` project-final closeout boundary。
3. 2026-05-14：`CR-006` project-final round clean `resolved` 后，`TK-1067 / DA-1067` 已完成 completion audit、current-context idle 恢复与 completed-stream history 迁移；`project-124` 现已正式进入 `completed`。

## 7. 里程碑记录入口

1. [project-124-empty-repo-self-host-readiness-follow-up-completion-audit-summary.md](./project-124-empty-repo-self-host-readiness-follow-up-completion-audit-summary.md)
