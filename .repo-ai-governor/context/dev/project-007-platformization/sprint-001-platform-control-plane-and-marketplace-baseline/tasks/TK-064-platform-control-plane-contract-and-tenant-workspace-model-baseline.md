# TK-064 平台控制面契约与租户工作区模型基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-001-platform-control-plane-and-marketplace-baseline`

## 1. 任务目标

定义组织/租户/工作区与能力开关控制面的统一契约，作为 Stage 8 平台化的控制面事实源基线。

## 2. Depends On

1. `DA-075`
2. `DA-076`

## 3. 预期产物

1. `DA-077` 平台控制面契约与租户工作区模型基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-006-exit-acceptance-and-project-007-input-constraints.md`
3. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-007-input-constraints-checklist.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 定义控制面核心实体（organization/tenant/workspace/capability-toggle）的字段与状态机。
2. 明确控制面契约与 runtime/adapter/reporting 的边界以及兼容要求。
3. 输出与 Stage 7 能力兼容的迁移与回滚约束。

## 6. 平台控制面契约与租户工作区模型基线（DA-077）

## 6.1 控制面核心实体与最小字段契约

1. `Organization`
   - `organizationId`：组织唯一标识。
   - `displayName`：组织展示名称。
   - `status`：`active/suspended/archived`。
   - `policyPackRef`：组织默认策略包引用。
   - `createdAt`、`updatedAt`：审计时间戳。
2. `Tenant`
   - `tenantId`：租户唯一标识。
   - `organizationId`：所属组织引用。
   - `status`：`active/suspended/offboarded`。
   - `workspaceMode`：`tool_managed/repo_local`。
   - `repoFingerprint`：目标仓库稳定指纹。
   - `budgetProfileId`：资源预算配置引用。
3. `WorkspaceBinding`
   - `workspaceId`：工作区唯一标识。
   - `tenantId`：所属租户引用。
   - `workspaceRoot`：治理根目录。
   - `repoRoot`：目标仓库根目录。
   - `status`：`provisioning/ready/migrating/degraded/retired`。
   - `lastHealthySnapshotId`：最近健康快照引用。
4. `CapabilityToggle`
   - `capabilityKey`：能力开关键。
   - `scope`：`organization/tenant/workspace`。
   - `targetId`：作用目标 ID。
   - `desiredState`：`enabled/disabled/confirm`。
   - `effectiveState`：当前生效状态。
   - `rolloutStrategy`：`immediate/canary/percentage`。
   - `status`：`draft/approved/released/rollbacked`。

## 6.2 生命周期状态机基线

1. 组织生命周期：`active -> suspended -> archived`。
2. 租户生命周期：`active -> suspended -> offboarded`。
3. 工作区生命周期：
   - 主链路：`provisioning -> ready -> migrating -> ready`。
   - 异常链路：`ready -> degraded -> ready`。
   - 退出链路：`ready/degraded -> retired`。
4. 能力开关生命周期：`draft -> approved -> released -> rollbacked`。

## 6.3 控制面最小 API 契约（Draft v1）

1. `upsertOrganization(input) -> { organizationId, status, updatedAt }`
2. `upsertTenant(input) -> { tenantId, status, workspaceMode, updatedAt }`
3. `bindWorkspace(input) -> { workspaceId, status, workspaceRoot, updatedAt }`
4. `setCapabilityToggle(input) -> { capabilityKey, targetId, effectiveState, rolloutStrategy, updatedAt }`
5. `getEffectiveCapabilitySnapshot(input) -> { snapshotId, toggles[], generatedAt }`
6. `listControlPlaneAuditFacts(input) -> { events[], nextCursor }`

## 6.4 模块边界与兼容约束

1. `core-runtime` 只读消费控制面快照，不直接写入组织/租户主数据。
2. `adapters/*` 仅消费 `getEffectiveCapabilitySnapshot` 结果，不允许绕过控制面直写开关状态。
3. `reporting` 复用控制面审计字段回链 `execution_id/workspace_id/capabilityKey`，保证回放一致性。
4. Stage 8 任何能力开关变更不得绕过 Stage 7 已固化门禁：
   - `test:resilience`
   - `release:rollback-rehearsal`
   - `release:ga-candidate-unified-gate`

## 6.5 迁移与回滚约束

1. 工作区模式切换严格遵循 `copy -> verify -> switch` 三阶段，不允许单步切换。
2. `WorkspaceBinding.status=migrating` 时若验证失败，必须回滚到 `lastHealthySnapshotId` 并记录审计事件。
3. 能力开关灰度失败或命中阻断策略时，必须触发 `rollbacked`，并回灌 `risk_level/required_action/matched_policies`。
4. 控制面配置升级与回滚需保持 `artifact_id + artifact_path` 可回链，避免跨任务引用漂移。

## 6.6 风险分级映射（承接 DA-076）

1. `BLOCK`
   - 任何变更导致 Stage 7 三个基线门禁失效或被绕过。
   - 工作区迁移失败且无法回滚到健康快照。
2. `CONFIRM`
   - 新增组织级策略分发通道但不改变既有语义。
   - 能力开关 rollout 策略从 `immediate` 变更为 `canary/percentage`。
3. `AUTO_APPLY`
   - 文案、回链字段与非语义索引补齐。
   - 不改变权限边界的只读查询扩展。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛控制面领域模型、生命周期状态与最小契约字段。
3. 2026-03-22：完成 `DA-077`，落地控制面实体/状态机/API/边界与迁移回滚约束，状态切换为 `completed`。

## 9. 产出

1. `DA-077` `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-064-platform-control-plane-contract-and-tenant-workspace-model-baseline.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/tasks.csv`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
