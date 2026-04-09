# TK-692 refresh surface gap decomposition draft against formal triad truth

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-071-draft-refresh-against-formal-triad`
- Sprint: `sprint-001-priority-and-decomposition-refresh`

## 1. 任务目标

用新的 formal PRD / brief / technical solution / architecture 真值，重写当前 surface gap decomposition draft 中的项目排序、`project-067` framing 与推荐执行顺序。

## 2. Depends On

1. `TK-691`

## 3. 预期产物

1. 刷新后的 project / sprint / task decomposition draft
2. 与 priority assessment 一致的执行顺序
3. 具有正式 triad 回链的 `project-067` follow-up framing

## 4. Required Inputs

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
3. formal triad + brief

## 5. 实施计划

1. 用新的 priority assessment 结论重排项目优先级与建议执行顺序。
2. 把 `project-067` 从“草稿里补出来的承载位”升级为“正式 triad 已要求的 host-native lifecycle follow-up”。
3. 保持 task 编号连续，并避免与 `project-068` reserved target follow-up 混写。

## 6. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-692`
2. docs/source cross-check：formal triad、assessment draft、decomposition draft

## 7. 执行记录

1. 2026-04-08：任务承接 `TK-691` 的新优先级判断，开始刷新 decomposition draft。
2. 2026-04-08：已把 Upstream 扩展到 PRD / brief / total technical solution / architecture，并将 `project-067` 升级为具有 formal triad 回链的 `P1` follow-up stream。
3. 2026-04-08：已重排 follow-up 项目顺序与推荐执行顺序，使 packaged install 与 host-native lifecycle 形成连续的 adopter-facing distribution truth lane。
4. 2026-04-08：decomposition draft 刷新完成，任务完成。
