# sprint-001-readiness-runtime-and-clean-room-dx 计划

- Status: completed
- Date: 2026-05-14
- Sprint Goal: 修复 self-host readiness/run gating、connect/apply/verify 提示面与 clean-room guidance truth
- Project: `project-124-empty-repo-self-host-readiness-follow-up`
- Upstream:
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-field-retrospective.md`
  - `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1063-empty-repo-self-host-clean-room-evidence-and-operator-path-truth.md`

## 1. Scope

1. 优先修复 verify blocked 与 run baseline allow 的运行时冲突，再补 operator next-action、baseline warning 文案与 clean-room guidance。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1065 | fix self-host readiness preflight and run gating contract | project-123 follow-up | completed |
| TK-1066 | improve self-host operator guidance and clean-room diagnostics wording | fix self-host readiness preflight and run gating contract | completed |
| TK-1067 | close sprint-001 and capture follow-up validation summary | improve self-host operator guidance and clean-room diagnostics wording | completed |

## 3. Exit Criteria

1. self-host readiness canonical truth、run preflight behavior 与 public guidance 不再相互矛盾。
2. 定向 tests、pnpm run build 与必要治理检查通过。

## 4. Sprint Notes

1. 当前项目承接 project-123 completed follow-up，不回滚 project-123 completed truth。
2. 2026-05-14：`TK-1065` 与 `TK-1066` 已完成并通过 delegated CR loops clean recheck；`TK-1067` 当前承担 project-final closeout write-back。
3. 2026-05-14：`CR-006` project-final round 已 clean `resolved`，`DA-1067` 与 completion audit summary 已完成；当前 sprint 已恢复为最终 `completed` 真值，并从 active execution surface 迁回 completed history。
