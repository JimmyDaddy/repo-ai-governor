# 审计字段补齐基线（workspace/session/memory，TK-215）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-002`
- Task: `TK-215`

## 1. 目标

统一 workspace、session、memory 三个域的审计字段模型，确保执行链路具备“可追踪、可回放、可导出、可脱敏”的最小审计能力，并可被后续报告与回放任务直接复用。

## 2. 范围与非目标

1. 范围：
   - 固化三域最小审计字段与命名口径。
   - 固化时间字段、显示字段、脱敏与保留策略。
   - 固化与 `tasks.csv`、Artifact Registry、Session Event 的映射关系。
2. 非目标：
   - 本任务不实现审计存储后端（文件/数据库）具体驱动。
   - 本任务不实现回放可视化界面（由后续 reporting/replay 任务负责）。

## 3. 审计事件通用契约（Draft）

```ts
enum AuditDomain {
  Workspace = "workspace",
  Session = "session",
  Memory = "memory",
  Dependency = "dependency",
  Notification = "notification",
}

enum AuditEventStatus {
  Started = "started",
  Succeeded = "succeeded",
  Failed = "failed",
  Interrupted = "interrupted",
}

enum AuditSensitivityLevel {
  Public = "public",
  Internal = "internal",
  Sensitive = "sensitive",
}

interface AuditEventRecord {
  eventId: string;
  executionId: string;
  stageId?: string;
  routeKey?: string;
  domain: AuditDomain;
  status: AuditEventStatus;
  workspaceId: string;
  workspaceMode: string;
  executionSessionId?: string;
  startedAt: string; // RFC3339 秒级
  endedAt?: string; // RFC3339 秒级
  startedAtDisplay: string; // YYYY-MM-DD HH:mm:ss UTC±HH:MM
  endedAtDisplay?: string;
  sensitivityLevel: AuditSensitivityLevel;
  actorRole?: string;
  roleProfileId?: string;
  sourceTaskId?: string;
  payload: Record<string, unknown>;
}
```

CS-009 落地要求：
1. `AuditDomain`、`AuditEventStatus`、`AuditSensitivityLevel` 必须集中放在 `src/constants/`。
2. 审计分支逻辑禁止散落字面量，统一使用常量集合。

## 4. 三域字段补齐矩阵

| domain | 必填字段 | 可选字段 | 说明 |
|---|---|---|---|
| workspace | `workspace_id`, `workspace_mode`, `workspace_root` | `repo_fingerprint`, `resolver_source` | 用于跨仓库定位与路径决策回放 |
| session | `execution_session_id`, `status`, `sequence` | `role_profile_id`, `skill_id`, `timeout_scope` | 用于多 Agent 协作与中断恢复追踪 |
| memory | `memory_scope`, `memory_delta` | `normative_asset_id`, `snapshot_id`, `checksum` | 用于上下文增量、快照与溯源 |

## 5. 与任务台账与依赖产物的映射

1. `tasks/tasks.csv.recorded_at` 作为任务执行记录时间锚点，需与审计事件时间字段同源。
2. 依赖解析相关事件必须补齐：
   - `artifact_id`, `artifact_version`, `producer_task_id`, `consumer_task_id`, `dependency_resolution_status`。
3. HITL 相关事件必须补齐：
   - `notification_channel`, `notification_status`, `notified_at_display`。

## 6. 脱敏、保留与导出策略

1. 脱敏规则：敏感 token、密钥、个人识别信息写入前必须脱敏。
2. 保留周期：默认 90 天（可配置覆盖）。
3. 导出与删除：按 `execution_id/project/sprint/date_range` 维度导出与删除。

## 7. 存储扩展边界

1. 基线存储：`<workspace_root>/context/audit-events/*.jsonl` + 汇总索引 CSV。
2. 扩展存储：SQLite/PostgreSQL 等后端，必须保持字段语义与时间格式一致。
3. 上层只依赖审计契约，不依赖具体后端实现。

## 8. 后续任务输入映射

1. `TK-216`：作为 M2 退出测试中的审计字段一致性验收输入。
2. `TK-506`：作为审计回放报告链路的字段事实源输入。
3. `TK-516`：作为 GA readiness 最终评审包的审计可追溯证据输入。

## 9. 验收标准

1. workspace/session/memory 三域字段口径已统一，且满足总方案 `9.3` 最小字段要求。
2. 时间字段与展示字段满足“秒级机器字段 + 人类可读展示字段”双轨要求。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
