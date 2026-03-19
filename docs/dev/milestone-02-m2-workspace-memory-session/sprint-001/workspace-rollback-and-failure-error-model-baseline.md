# Workspace 回滚与失败错误模型基线（TK-206）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-001`
- Task: `TK-206`

## 1. 目标

定义 workspace 双模式与迁移链路的统一失败分类、回滚策略与错误语义，确保 `tool_managed/repo_local` 在初始化、迁移、切换、恢复全过程可预测、可恢复、可审计。

## 2. 范围与非目标

1. 范围：
   - 固化失败分类体系与错误码分层（domain + stage）。
   - 固化回滚决策矩阵与恢复策略（auto/manual/blocked）。
   - 固化失败审计字段、通知触发与人工介入门槛。
2. 非目标：
   - 本任务不实现具体恢复代码与补偿脚本。
   - 本任务不覆盖所有业务域错误，仅覆盖 workspace 与迁移主链路。
   - 本任务不替代 M3 编排层的超时/取消机制实现（由 `TK-306` 实施）。

## 3. 失败分类总表

统一错误分类（与总方案 5.3 对齐）：
1. `transient`：短时异常（临时 I/O 抖动、锁暂占、瞬时资源不足）。
2. `permanent`：确定性错误（配置非法、路径不可用、权限拒绝）。
3. `policy_blocked`：策略阻断（命中策略规则，不允许继续）。
4. `timeout`：阶段超时（copy/verify/switch 任一阶段超时）。
5. `cancelled`：用户/系统主动取消。
6. `concurrency_conflict`：并发冲突（锁冲突、版本戳冲突）。
7. `budget_exceeded`：预算超限（时间/资源预算超标）。

## 4. 错误码分层模型

### 4.1 Domain 级错误码

1. `WORKSPACE_MODE_INVALID`
2. `WORKSPACE_ROOT_UNAVAILABLE`
3. `WORKSPACE_FINGERPRINT_CONFLICT`
4. `WORKSPACE_CONTEXT_INTEGRITY_FAILED`
5. `WORKSPACE_ROLLBACK_NOT_POSSIBLE`

### 4.2 Migration Stage 级错误码

1. `WORKSPACE_MIGRATION_PRECHECK_FAILED`
2. `WORKSPACE_MIGRATION_COPY_FAILED`
3. `WORKSPACE_MIGRATION_VERIFY_FAILED`
4. `WORKSPACE_MIGRATION_SWITCH_FAILED`
5. `WORKSPACE_MIGRATION_ROLLBACK_FAILED`

### 4.3 Repo-Local 兼容级错误码

1. `WORKSPACE_REPO_LOCAL_ROOT_UNWRITABLE`
2. `WORKSPACE_REPO_LOCAL_COMPAT_INCOMPATIBLE`
3. `WORKSPACE_REPO_LOCAL_RECONCILE_FAILED`
4. `WORKSPACE_REPO_LOCAL_EXPLICIT_MODE_NO_FALLBACK`

## 5. 回滚决策矩阵

1. `copy` 失败：
   - `transient` -> 允许重试，超阈值后回滚；
   - `permanent/policy_blocked` -> 直接回滚。
2. `verify` 失败：
   - 校验不一致或关键文件缺失 -> 必须回滚；
   - 可恢复缺失（non-critical）-> 可 `reconcile` 后二次校验。
3. `switch` 失败：
   - active 指针未生效或写回失败 -> 必须回滚。
4. `rollback` 失败：
   - 升级为 `critical` 级故障并触发强制人工介入（`escalate` + 通知）。

## 6. 恢复策略（Recovery Policy）

1. `auto_retry`：
   - 仅允许 `transient` + `retryable=true`，遵循 `maxRetries/backoff/jitter`。
2. `auto_rollback`：
   - 迁移阶段失败默认执行，恢复到 `source_workspace_root`。
3. `manual_reconcile`：
   - `compat_probe=needs_reconcile` 或 `concurrency_conflict` 进入人工处理。
4. `hard_block`：
   - `policy_blocked`、`rollback_failed`、`integrity_failed` 必须阻断后续阶段。

## 7. 状态与阶段语义

建议状态集合：
1. `ready`
2. `degraded`
3. `migration_precheck`
4. `migration_copying`
5. `migration_verifying`
6. `migration_switching`
7. `migration_failed`
8. `migration_rolling_back`
9. `migration_rolled_back`
10. `blocked_manual_intervention`

约束：
1. `migration_failed` 之后必须进入 `migration_rolling_back` 或 `blocked_manual_intervention`。
2. 仅 `ready` 状态可作为 active workspace 对外服务。

## 8. 最小错误契约（Draft）

```ts
enum WorkspaceFailureClass {
  Transient = "transient",
  Permanent = "permanent",
  PolicyBlocked = "policy_blocked",
  Timeout = "timeout",
  Cancelled = "cancelled",
  ConcurrencyConflict = "concurrency_conflict",
  BudgetExceeded = "budget_exceeded",
}

enum WorkspaceFailureStage {
  Precheck = "precheck",
  Copy = "copy",
  Verify = "verify",
  Switch = "switch",
  Rollback = "rollback",
}

enum WorkspaceMode {
  ToolManaged = "tool_managed",
  RepoLocal = "repo_local",
}

interface WorkspaceFailureEvent {
  errorCode: string;
  errorClass: WorkspaceFailureClass;
  workspaceId: string;
  workspaceMode: WorkspaceMode;
  workspaceRoot: string;
  stage: WorkspaceFailureStage;
  retryable: boolean;
  rollbackRequired: boolean;
  occurredAt: string; // RFC3339, 秒级，例如 2026-03-19T18:22:47+08:00
}
```

CS-009 落地要求：
1. `WorkspaceFailureClass`、`WorkspaceFailureStage`、`WorkspaceMode` 在实现中必须集中放置到 `src/constants/`。
2. 禁止在 workspace/migration 运行时模块中散落同语义字面量集合；如需临时字面量必须显式注释 `// literal-set-allowed: reason`。

## 9. 审计与通知要求

最小审计字段：
1. `migration_execution_id`
2. `workspace_id`, `workspace_mode`, `workspace_root`
3. `error_code`, `error_class`, `stage`
4. `retry_count`, `rollback_required`, `rollback_result`
5. `decision`（allow/confirm/block/escalate）
6. `occurred_at`, `resolved_at`（RFC3339 秒级）

通知触发：
1. `rollback_failed` 必须触发 `escalate` 通知。
2. 连续失败达到阈值（例如 3 次）触发人工确认。
3. `policy_blocked` 触发阻断通知并附恢复建议。

## 10. 与 M3 的衔接约束

1. `timeout/cancelled/concurrency_conflict` 分类与恢复策略作为 `TK-306` 输入基线。
2. M3 编排层应复用本节错误语义，不得重新定义冲突含义。

## 11. 后续任务输入映射

1. `TK-216`：将本基线纳入 M2 退出测试证据包。
2. `TK-306`：复用本基线完成编排层超时/取消/并发冲突恢复落地。

## 12. 验收标准

1. 失败分类、错误码分层与回滚决策矩阵已固定。
2. 错误契约与审计字段可直接指导实现与回放。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
