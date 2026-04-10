# TK-721 re-review updated transport-selection-authority draft and update lifecycle approval state

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-074-transport-selection-authority-solution-review`
- Sprint: `sprint-002-draft-remediation-and-rereview`

## 1. 任务目标

在 draft 修订完成后，基于同一 canonical review artifact 做 `re-review-after-updates`，为上一轮 blocking findings 记录 disposition，并按复审结果回写 lifecycle 状态。

## 2. Depends On

1. `TK-720`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`

## 3. 预期产物

1. 更新后的 canonical review artifact
2. 更新后的 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. 明确的 `changes_required` / `approved` 复审结论

## 4. Required Inputs

1. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`

## 5. Traceback References

1. `.codex/skills/technical-solution-review/SKILL.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`

## 6. 实施计划

1. 复查两条 blocking finding 是否都已获得清晰 disposition。
2. 若无 blocking finding 残留，则把 canonical review artifact 推进到下一生命周期并更新 lifecycle registry。
3. 保持 `final_paths` 为空，不在本任务内做 promotion cutover。

## 7. Development Verification

1. review baseline refresh：draft + lifecycle + canonical review artifact + affected formal docs

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-721 --tasks-dir ".repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-002-draft-remediation-and-rereview/tasks" --result "Completed re-review-after-updates for the transport-selection-authority draft and updated lifecycle state to match the refreshed verdict." --verify "node ./scripts/governance/check-technical-solution-lifecycle-registry.js" --review-delta "Reused the canonical solution review artifact and recorded dispositions for the previous blocking findings."`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
3. docs-only re-review window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`，等待 `TK-720` 完成后执行 re-review-after-updates。
2. 2026-04-09：已基于修订后的 draft 复查上一轮两条 blocking finding，确认 onboarding canonical truth slot 与 public support wording evidence gate 都已清楚收口。
3. 2026-04-09：已将 canonical review artifact verdict 推进到 `approved`，并把 lifecycle 状态同步更新为 `approved`；`final_paths` 继续保持空值。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
