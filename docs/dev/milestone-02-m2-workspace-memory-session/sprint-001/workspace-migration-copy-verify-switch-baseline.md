# Workspace 迁移链路基线（Copy/Verify/Switch）（TK-205）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-001`
- Task: `TK-205`

## 1. 目标

定义 workspace 模式切换时的 `copy/verify/switch` 迁移链路与执行契约，确保 `tool_managed <-> repo_local` 切换过程中状态可追踪、失败可回滚、结果可审计。

## 2. 范围与非目标

1. 范围：
   - 固化迁移前置校验、阶段状态机与阶段产物。
   - 固化 `copy`、`verify`、`switch` 的最小执行规则与验收口径。
   - 固化失败回滚触发条件与最小恢复策略入口。
2. 非目标：
   - 本任务不完成错误模型最终分类收口（由 `TK-206` 负责）。
   - 本任务不覆盖跨版本数据结构升级脚本的全量实现。
   - 本任务不覆盖远端数据库后端迁移（本轮限定本地文件/CSV 基线）。

## 3. 迁移入口与前置条件

1. 输入：
   - `source_workspace_mode/root`
   - `target_workspace_mode/root`
   - `workspace_id`
   - `repo_fingerprint`
2. 前置条件：
   - 源 workspace 可读；
   - 目标 workspace 目标路径可写；
   - 当前执行链路无冲突中的初始化/迁移锁；
   - 模式切换获得策略许可（高风险时可触发 HITL `confirm/escalate`）。

## 4. 迁移状态机（事务化）

建议状态：
1. `migration_precheck`
2. `migration_copying`
3. `migration_verifying`
4. `migration_switching`
5. `migration_succeeded`
6. `migration_failed`
7. `migration_rolling_back`
8. `migration_rolled_back`

状态约束：
1. 任一阶段失败必须进入 `migration_failed`，然后进入 `migration_rolling_back`。
2. 仅当 `verify` 通过后才允许进入 `switch`。
3. 未到 `migration_succeeded` 前，不得将新 workspace 标记为 active。

## 5. 阶段契约

### 5.1 Copy

1. 复制最小受管资产：
   - `governor.yaml`
   - `context/current-context.md`
   - `context/compiled-ir/`
   - `context/artifact-registry/artifacts.csv`
   - `normative_knowledge_sources/`
   - `artifacts/`
2. 复制策略：
   - 优先增量复制（存在同名文件时比较版本/时间戳/校验和）；
   - 保留源路径只读快照直到迁移完成。

### 5.2 Verify

最小校验矩阵：
1. 文件数量一致（受管路径）。
2. 关键文件存在且可读：
   - `context/current-context.md`
   - `normative_knowledge_sources/`
   - `artifacts/`
3. 元数据一致：
   - `workspace_id`、`repo_fingerprint`、`workspace_mode`（目标）一致。
4. 抽样校验和一致（可配置全量）。
5. 目标路径心跳写入/读回成功。

### 5.3 Switch

1. 原子切换 active workspace 指针到目标路径。
2. 更新 `governor.yaml -> workspace` 的实际生效模式与路径指向。
3. 写入迁移完成事件与切换后快照。
4. 切换成功后，源 workspace 保留回滚窗口（例如可配置 N 天）。

## 6. 回滚触发与最小恢复策略

触发条件（任一命中）：
1. `copy` 阶段中断且源数据完整性受影响风险高。
2. `verify` 失败（关键文件缺失、校验和不一致、心跳失败）。
3. `switch` 失败（active 指针未生效、写回失败、状态不一致）。

最小恢复策略：
1. active 指针恢复到切换前 `source_workspace_root`。
2. 目标路径标记为 `degraded`，保留故障现场供诊断。
3. 记录 `rollback_reason`、`rollback_at`（RFC3339 秒级）和故障阶段。

## 7. 并发与幂等约束

1. 同一 `workspace_id` 同时仅允许一个迁移实例（迁移锁）。
2. 重复提交相同迁移请求应返回同一 `migration_execution_id` 或幂等完成结果。
3. 中断后重试应优先 `resume` 或 `rollback-and-retry`，禁止无状态重跑覆盖。

## 8. 审计与通知要求

最小审计字段：
1. `migration_execution_id`
2. `workspace_id`
3. `source_workspace_mode/root`
4. `target_workspace_mode/root`
5. `migration_state`
6. `stage_started_at`, `stage_finished_at`（RFC3339 秒级）
7. `verify_summary`
8. `rollback_reason`（如有）

通知触发建议：
1. 高风险迁移前触发 HITL 通知（`confirm/escalate`）。
2. 迁移失败和回滚完成后触发通知回执，便于人工介入与追踪。

## 9. 建议错误码（迁移阶段）

1. `WORKSPACE_MIGRATION_PRECHECK_FAILED`
2. `WORKSPACE_MIGRATION_COPY_FAILED`
3. `WORKSPACE_MIGRATION_VERIFY_FAILED`
4. `WORKSPACE_MIGRATION_SWITCH_FAILED`
5. `WORKSPACE_MIGRATION_ROLLBACK_FAILED`

## 10. 后续任务输入映射

1. `TK-206`：消费本基线收口迁移失败分类、回滚异常处理与错误模型。
2. `TK-216`：将本基线纳入 M2 退出测试与文档收口证据。

## 11. 验收标准

1. `copy/verify/switch` 阶段契约、状态机与校验口径已固定。
2. 失败触发、回滚入口与审计字段可直接指导实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
