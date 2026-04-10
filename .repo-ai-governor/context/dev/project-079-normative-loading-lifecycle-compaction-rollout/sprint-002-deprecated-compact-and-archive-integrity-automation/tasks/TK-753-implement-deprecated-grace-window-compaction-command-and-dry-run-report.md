# TK-753 implement deprecated grace-window compaction command and dry-run report

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-002-deprecated-compact-and-archive-integrity-automation`

## 1. 任务目标

实现 `deprecated -> archived` grace-window compaction command，并支持 `dry-run` 报告输出。

## 2. Depends On

1. `TK-752`

## 3. 预期产物

1. compact command
2. `dry-run` report shape
3. deprecated backlog evidence

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
2. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-001-archive-split-and-bootstrap-truth-preservation/tasks/TK-752-implement-archive-split-and-root-manifest-archived-entry-compaction-baseline.md`
3. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`

## 6. 实施计划

1. 固定 grace-window 计算与 dry-run result shape。
2. 实现超期 `deprecated` entry 的筛选与 archive migration workflow。
3. 保留 fail-safe rollback guidance，不把 compact 逻辑扩展成新的 active truth surface。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：sprint-001 clean closeout 已完成，`TK-753` 切换为 `active`，开始实现 deprecated compact command 与 dry-run report baseline。

## 10. 产出

1. 待执行：compact command
2. 待执行：dry-run report shape
