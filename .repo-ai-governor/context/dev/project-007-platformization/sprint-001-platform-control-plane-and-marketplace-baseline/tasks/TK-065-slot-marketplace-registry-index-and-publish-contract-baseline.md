# TK-065 插槽市场注册索引与发布契约基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-001-platform-control-plane-and-marketplace-baseline`

## 1. 任务目标

定义 slot marketplace 的注册索引、发布流程、兼容性声明与消费路由契约，建立平台扩展供给侧基线。

## 2. Depends On

1. `TK-064`
2. `DA-077`

## 3. 预期产物

1. `DA-078` 插槽市场注册索引与发布契约基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-064-platform-control-plane-contract-and-tenant-workspace-model-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 5. 实施计划

1. 定义 marketplace pack/slot 的注册字段、版本语义与状态流转。
2. 定义发布闸口（兼容性、安全审计、回滚可用性）与失败处置。
3. 定义消费侧解析策略与与 artifact registry 的回链字段。

## 6. 插槽市场注册索引与发布契约基线（DA-078）

## 6.1 Registry 最小字段契约（Draft v1）

1. `slotPackageId`：插槽包唯一标识（稳定 ID，不含版本）。
2. `slotVersion`：语义化版本（`major.minor.patch`）。
3. `slotName`：人类可读名称。
4. `slotType`：`declarative/scripted`。
5. `ownerScope`：`organization/tenant/workspace`。
6. `ownerId`：scope 对应主体 ID。
7. `status`：`draft/verified/published/deprecated/revoked`。
8. `compatibility`：
   - `coreRuntimeRange`
   - `policyEngineRange`
   - `adapterSdkRange`
9. `permissionManifest`：
   - `filesystem`: `read/write/none`
   - `network`: `restricted/none`
   - `command`: `allowlist[]`
10. `integrity`：
   - `slotHash`（内容摘要）
   - `signatureRef`（签名引用）
11. `artifactRef`：
   - `artifactId`
   - `artifactPath`
12. `timestamps`：
   - `registeredAt`
   - `verifiedAt`
   - `publishedAt`

## 6.2 发布状态机与通道契约

1. 状态机主链路：`draft -> verified -> published -> deprecated`。
2. 异常链路：任一发布闸口失败进入 `revoked`，并写入失败原因。
3. 发布通道：
   - `canary`
   - `rc`
   - `ga`
4. 通道推进约束：
   - `canary -> rc` 需通过兼容与沙箱审计。
   - `rc -> ga` 需通过签名、完整性与回滚可用性检查。

## 6.3 Publish Gate 契约（最小）

1. `contractCompatibilityCheck`
   - 验证 `compatibility.*Range` 与当前平台版本匹配。
2. `sandboxPermissionCheck`
   - 验证 `permissionManifest` 不突破平台允许上限。
3. `integritySignatureCheck`
   - 验证 `slotHash/signatureRef` 一致且可追溯。
4. `rollbackReadinessCheck`
   - 必须声明上一个稳定版本并验证可回滚路径。
5. `auditEventCheck`
   - 发布过程写入可回放审计字段（见 6.5）。

## 6.4 消费侧解析与路由契约

1. 解析策略：
   - `strict`：只接受 `pinnedVersion`。
   - `compatible`：接受同 major 的最高可用版本（默认）。
   - `latest`：接受最高已发布版本（仅低风险场景）。
2. 路由优先级：
   - workspace override > tenant default > organization default。
3. 失败语义：
   - 解析失败默认 `block`，必要时 `escalate`。
   - 不允许 silent fallback 到未审计版本。

## 6.5 审计事件字段基线（Marketplace）

1. `slotPackageId`
2. `slotVersion`
3. `publishChannel`
4. `publishDecision`（allow/block/escalate）
5. `gateResults[]`
6. `consumerScope`
7. `resolutionPolicy`
8. `resolvedVersion`
9. `executionId`
10. `workspaceId`

## 6.6 与 Stage 7 约束对齐

1. 插槽市场发布契约不得绕过 Stage 7 既有门禁：
   - `test:resilience`
   - `release:rollback-rehearsal`
   - `release:ga-candidate-unified-gate`
2. 任一发布通道异常必须具备结构化失败证据，满足回放与升级决策要求。
3. Marketplace 产物必须登记到 artifact registry，并保持 `artifact_id + artifact_path` 双键回链。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛 marketplace 注册索引字段、发布状态机与消费解析契约。
3. 2026-03-22：完成 `DA-078`，补齐注册索引/发布闸口/消费解析/审计字段基线，状态切换为 `completed`。

## 9. 产出

1. `DA-078` `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-065-slot-marketplace-registry-index-and-publish-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/tasks.csv`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
