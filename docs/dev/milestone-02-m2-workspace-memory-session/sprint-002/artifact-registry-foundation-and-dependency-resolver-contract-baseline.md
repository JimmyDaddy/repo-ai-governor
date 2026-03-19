# Artifact Registry 基座与 Dependency Resolver 契约基线（TK-217）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-002`
- Task: `TK-217`

## 1. 目标

定义 Artifact Registry 与 Dependency Resolver 的最小可执行契约，确保关键产物可自动注册、任务启动前可解析依赖并按策略处理缺失/不兼容问题。

## 2. 范围与非目标

1. 范围：
   - 固化产物注册字段、解析字段、版本策略与失败策略。
   - 固化默认存储模型与扩展后端边界。
   - 固化与 workspace/memory/audit 的集成契约。
2. 非目标：
   - 本任务不实现 M3 运行时自动注入流程（由 `TK-307` 负责）。
   - 本任务不提供可视化查询界面。

## 3. 产物注册契约（Draft）

```ts
enum ArtifactType {
  Plan = "plan",
  TaskLedger = "task-ledger",
  TechnicalBaseline = "technical-baseline",
  ReviewRecord = "review-record",
  ExitReport = "exit-report",
}

enum ArtifactStatus {
  Active = "active",
  Deprecated = "deprecated",
  Archived = "archived",
  Invalid = "invalid",
}

interface ArtifactRecord {
  artifactId: string;
  artifactType: ArtifactType;
  artifactPath: string;
  artifactVersion: string;
  artifactStatus: ArtifactStatus;
  producerTaskId: string;
  producerExecutionId: string;
  workspaceId: string;
  registeredAt: string; // RFC3339 秒级
  registeredAtDisplay: string; // YYYY-MM-DD HH:mm:ss UTC±HH:MM
  checksum?: string;
}
```

CS-009 落地要求：
1. `ArtifactType` 与 `ArtifactStatus` 必须集中放在 `src/constants/`。
2. 产物状态判定禁止散落字面量，统一由常量集合驱动。

## 4. 依赖解析契约（Draft）

```ts
enum ResolutionPolicy {
  Strict = "strict",
  Compatible = "compatible",
  Latest = "latest",
}

enum ResolutionResultStatus {
  Resolved = "resolved",
  Missing = "missing",
  Incompatible = "incompatible",
  Inactive = "inactive",
}

enum ResolutionFailureAction {
  Block = "block",
  Escalate = "escalate",
  Warn = "warn",
}

interface DependencyResolutionRequest {
  consumerTaskId: string;
  dependsOnArtifacts: string[];
  resolutionPolicy: ResolutionPolicy;
  workspaceId: string;
  executionSessionId?: string;
}

interface DependencyResolutionResult {
  consumerTaskId: string;
  resolutionResult: ResolutionResultStatus;
  resolvedArtifacts: string[];
  missingArtifacts: string[];
  incompatibleArtifacts: string[];
  failureAction: ResolutionFailureAction;
}
```

## 5. 默认存储与扩展存储

1. 默认索引路径：`<workspace_root>/context/artifact-registry/artifacts.csv`。
2. 默认字段与契约字段保持一一对应，禁止临时字段漂移。
3. 可扩展后端：SQLite/PostgreSQL；扩展时必须保证 `ResolutionPolicy` 语义一致。

## 6. 运行时处理策略

1. 任务执行前必须先解析 `depends_on_artifacts`。
2. `missing/incompatible/inactive` 结果按策略触发 `block/escalate/warn`。
3. 解析结果必须写入审计事件字段：
   - `artifact_id`, `artifact_version`, `producer_task_id`, `consumer_task_id`, `dependency_resolution_status`。

## 7. 与架构分层与依赖方向对齐

1. `artifact-registry` 包可依赖 `shared-types/config/core-audit`。
2. `artifact-registry` 不得依赖 `apps/cli` 与具体 `adapters/*`。
3. `core-runtime` 仅依赖 `artifact-registry` 公共契约，不读取后端细节。

## 8. 后续任务输入映射

1. `TK-307`：接入运行时自动注册与上下文注入。
2. `TK-316`：作为 M3 端到端编排链路的依赖解析验证输入。
3. `TK-501`：作为 M5 契约测试关键覆盖输入。

## 9. 验收标准

1. 注册与解析最小契约字段已固定，且与总方案 `4.2.3` 一致。
2. 默认存储与扩展存储边界清晰，语义可保持一致。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
