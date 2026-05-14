# sprint-004-clean-room-evidence-and-docs-truthfulness 计划

- Status: active
- Date: 2026-05-13
- Sprint Goal: 完成 empty-repo self-host clean-room rehearsal、support truth 对齐与 project closeout
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 1. Scope

1. 重新演练 empty repo self-host-complete + repo_local path，并产出从 install 到 first dry-run 的 clean-room evidence packet。
2. 基于真实 operator path 回写 README、local-adoption playbook 与 support matrix truthfulness。
3. 完成 delivery evidence、completion audit 与 project closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1063 | run empty-repo self-host clean-room rehearsal and capture rollout evidence | close sprint-003 and hand off clean-room truthfulness follow-through | active |
| TK-1064 | refresh self-host docs truth and finalize rollout closeout | run empty-repo self-host clean-room rehearsal and capture rollout evidence | planned |

## 3. Exit Criteria

1. fresh empty-repo clean-room rehearsal、public docs truthfulness、delivery evidence 与 project closeout 已齐备。
2. project-123 closeout 所需 completion audit 与后续 delivery evidence 回链入口已准备完成。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-003-activation-and-readiness-ux handoff 或用户显式激活。
4. 2026-05-14：`DA-1062` 已将该 sprint 激活为 `project-123` 的 primary execution surface；下一条 implementation boundary 固定为 `TK-1063` 和 `/Users/jimmydaddy/study/deepseekian` clean-room rehearsal。
