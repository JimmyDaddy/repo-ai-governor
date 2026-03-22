# TK-072 跨租户审计视图与导出治理落地

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
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

## 6. 跨租户审计视图与导出治理实现基线（DA-085）

1. 查询与聚合模型
   - 查询范围强制限定在 `organizationId` 作用域。
   - 支持按 `tenantId/workspaceId/policyPackageId/executionId/timeRange` 组合过滤。
   - 聚合视图输出需保留原始事件引用，避免丢失追溯路径。
2. 访问控制模型
   - `OrgAuditViewer`：允许检索与只读查看。
   - `OrgAuditMaintainer`：允许导出与保留策略配置。
   - `OrgSecurityAuditor`：允许执行审计合规核对与高风险导出审批。
   - 跨组织访问一律阻断并记录拒绝事件。
3. 导出治理规则
   - 导出必须携带 `organizationId + timeRange + purpose`。
   - 导出默认执行字段脱敏（租户隐私标识、个人可识别字段）。
   - 导出产物必须记录 `exportId`、`requester`、`approvedBy`、`retentionPolicy`。
4. 可追溯性约束
   - 审计记录与导出记录必须回链：
     - `executionId`
     - `executionSessionId`
     - `artifactId`
     - `policyPackageId`
   - 任意查询结果都必须可定位到原始事件时间线。
5. 失败语义
   - `audit_query_scope_invalid`：阻断并返回纠正建议。
   - `audit_export_permission_denied`：拒绝导出并写审计。
   - `audit_export_masking_failed`：导出失败并触发升级处理。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛跨租户审计查询、导出与权限治理边界。
3. 2026-03-22：完成 `DA-085`，固化跨租户审计视图与导出治理实现基线，状态切换为 `completed`。

## 9. 产出

1. `DA-085` `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-072-cross-tenant-audit-view-and-export-governance.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/plan.md`
5. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
