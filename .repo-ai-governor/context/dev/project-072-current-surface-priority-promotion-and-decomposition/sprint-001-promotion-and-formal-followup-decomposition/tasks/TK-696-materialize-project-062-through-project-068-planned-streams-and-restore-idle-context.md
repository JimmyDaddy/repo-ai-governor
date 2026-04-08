# TK-696 materialize project-062 through project-068 planned streams and restore idle context

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-072-current-surface-priority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-formal-followup-decomposition`

## 1. 任务目标

把 formal solution 直接拆成 `project-062 ~ project-068` 的 planned execution stream skeleton，并在 closeout 后恢复 `idle` primary state。

## 2. Depends On

1. `TK-695`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`

## 3. 预期产物

1. `project-062 ~ project-068` project / sprint / task skeleton
2. `DA-696` handoff artifact
3. 更新后的 `current-context.md` 与 `completed-streams-history.md`

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/plan.md`
2. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/plan.md`

## 6. 实施计划

1. 为每个 future project 创建 planned plan / sprint / task card skeleton。
2. 将 `project-062 ~ project-068` 登记到 `current-context.md` 的 planned follow-up surface。
3. 完成 `project-072` closeout write-back，并把该 stream 移入 completed history。

## 7. Development Verification

1. planned task-card and sprint-plan completeness check
2. current-context planned stream path existence check

## 8. Delivery Verification

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已完成 `project-062 ~ project-068` skeleton、`DA-696` handoff artifact、planned stream 登记与 `project-072` 最终 closeout write-back。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`
2. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/plan.md`
