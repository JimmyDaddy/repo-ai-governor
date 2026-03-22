# TK-072 跨租户审计视图与导出治理落地

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P1
- Project: `project-007-platformization`
- Sprint: `sprint-002-org-governance-and-rollout-readiness`

## 1. 任务目标

实现跨租户审计视图检索、导出与权限治理，确保平台化审计能力可追溯且不突破访问边界。

## 2. Depends On

1. `TK-068`
2. `TK-071`
3. `DA-081`
4. `DA-084`

## 3. 预期产物

1. `DA-085` 跨租户审计视图与导出治理实现基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-071-org-policy-package-distribution-and-version-governance.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 5. 实施计划

1. 打通跨租户审计查询与视图聚合路径。
2. 落实导出权限与审计脱敏治理策略。
3. 保证导出结果可回链 execution/session/artifact 关键字段。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
