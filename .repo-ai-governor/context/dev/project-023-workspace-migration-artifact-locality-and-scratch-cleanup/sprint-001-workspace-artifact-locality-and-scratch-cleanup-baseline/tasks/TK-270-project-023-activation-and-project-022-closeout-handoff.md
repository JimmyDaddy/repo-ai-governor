# TK-270 project-023 激活与 project-022 closeout handoff

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. 任务目标

创建 `project-023` 执行流，并将 active execution surface 从已完成的 `project-022 / sprint-003-seam-follow-through-or-project-closeout` 平滑切换到新的 workspace migration ergonomics follow-up 主线。

## 2. Depends On

1. `project-022-memory-semantics-safety-and-consumer-hardening-completion-audit-summary.md`
2. `project-022 / sprint-003-seam-follow-through-or-project-closeout` completed

## 3. 预期产物

1. `project-023` skeleton
2. 更新后的 `current-context.md`
3. 更新后的 `.repo-ai-governor/context/completed-streams-history.md`
4. `DA-270`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/project-022-memory-semantics-safety-and-consumer-hardening-completion-audit-summary.md`
3. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/project-020-adoption-productization-and-upgrade-ux-completion-audit-summary.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
2. `docs/local-adoption-playbook.md`

## 6. 实施计划

1. 创建 `project-023 / sprint-001` 的 `plan / tasks / review` 目录。
2. 将 `current-context.md` 切换到新的 active primary stream。
3. 将已完成的 `project-022 / sprint-003` 迁入 completed history，并把新流回写到 master plan。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始创建 `project-023 / sprint-001` skeleton、切换 current-context 并迁移 `project-022 / sprint-003` history。
3. 2026-03-27：已完成 `project-023` skeleton、current-context 切换、completed history 迁移与 `DA-270`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-023-workspace-migration-artifact-locality-and-scratch-cleanup/plan.md`
2. `.repo-ai-governor/context/dev/project-023-workspace-migration-artifact-locality-and-scratch-cleanup/sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline/plan.md`
3. `DA-270`
