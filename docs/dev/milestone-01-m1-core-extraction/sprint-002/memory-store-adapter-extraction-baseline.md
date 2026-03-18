# Memory-Store-Adapter 抽离基线（TK-113）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-002`
- Task: `TK-113`

## 1. 目标

定义 `memory-store-adapter` 的抽离边界、统一 Provider 契约与装配路径，确保 `core-memory` / `core-session` 仅依赖稳定存储接口，在不改变上层语义的前提下切换本地文件/CSV、SQLite、PostgreSQL 等存储后端。

## 2. 范围与非目标

1. 范围：
   - `packages/memory-store-adapter` 的职责、目录结构与公共入口基线。
   - 存储 Provider 统一契约（`read/write/query/snapshot/archive`）与能力声明。
   - Provider 注册与装配策略（`tool_managed/repo_local` workspace 模式可复用）。
2. 非目标：
   - 本任务不实现完整 Provider 功能细节；M1 仅固定契约与抽离落位。
   - 本任务不实现 `core-memory` 业务规则与会话生命周期逻辑（属于 `TK-111`/`TK-112`）。
   - 本任务不替换全部旧存储调用点，只固定可渐进迁移的桥接策略。

## 3. 包职责边界

### 3.1 `memory-store-adapter` 负责

1. 定义跨 Provider 稳定存储契约与错误语义。
2. 管理 Provider 注册、装配、探活（probe）与能力匹配。
3. 向 `core-memory`、`core-session` 输出统一读写接口与结果模型。
4. 输出标准审计元数据（providerId/kind/latencyMs/updatedAt/updatedAtDisplay）。

### 3.2 `memory-store-adapter` 不负责

1. 记忆分层业务规则（normative/operational 读写策略）由 `core-memory` 负责。
2. 会话事件与快照回放编排由 `core-session` 负责。
3. CLI 参数解析与命令路由由 `apps/cli` 负责。

## 4. 依赖方向约束（M1 阶段）

1. `memory-store-adapter` 可依赖：
   - `config`
   - `shared-types`
   - `shared-utils`
2. `memory-store-adapter` 不可依赖：
   - `apps/cli`
   - `core-runtime`
   - `adapters/*`
   - `notification-*`
3. 协作方向：
   - `memory-providers/*` 仅依赖 `memory-store-adapter` 暴露的共享契约。
   - `core-memory`/`core-session` 仅依赖 `memory-store-adapter` 公共入口，不依赖具体 provider。

## 5. 目录与入口基线

```text
packages/memory-store-adapter/
  src/
    constants/
      memory-provider-kind.ts
      memory-query-operator.ts
      memory-archive-reason.ts
    shared-types/
      memory-store-provider.interface.ts
      memory-store-request.interface.ts
      memory-store-result.interface.ts
      index.ts
    provider-registry.ts
    provider-factory.ts
    store-adapter-runtime.ts
    index.ts
  test/
    store-adapter-runtime.contract.test.ts
    provider-registry.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014`。
2. 有限集合值统一放 `src/constants/`，对齐 `CS-009`。
3. 对外统一通过 `index.ts` 暴露稳定入口；provider 只能消费 `shared-types` 导出的契约。

## 6. 最小存储契约（M1 Draft）

```ts
enum MemoryProviderKind {
  FsCsv = "fs-csv",
  Sqlite = "sqlite",
  Postgres = "postgres",
}

enum MemoryQueryOperator {
  Eq = "eq",
  Prefix = "prefix",
  In = "in",
  Exists = "exists",
  UpdatedAfter = "updated-after",
}

enum MemoryArchiveReason {
  SessionFinalized = "session-finalized",
  ManualSnapshot = "manual-snapshot",
  MigrationCheckpoint = "migration-checkpoint",
  RetentionCompaction = "retention-compaction",
}

interface MemoryStoreProvider {
  id: string;
  kind: MemoryProviderKind;
  probe(request: MemoryProviderProbeRequest): Promise<MemoryProviderProbeResult>;
  read(request: MemoryReadRequest): Promise<MemoryReadResult>;
  write(request: MemoryWriteRequest): Promise<MemoryWriteResult>;
  query(request: MemoryQueryRequest): Promise<MemoryQueryResult>;
  snapshot(request: MemorySnapshotRequest): Promise<MemorySnapshotResult>;
  archive(request: MemoryArchiveRequest): Promise<MemoryArchiveResult>;
}
```

契约约束：
1. 时间字段使用 RFC3339 秒级时间戳（例如 `2026-03-19T10:12:05+08:00`）。
2. 同时输出 `updatedAtDisplay`（人类可读时间）用于 CLI 展示与审计报表。
3. `query/snapshot/archive` 必须包含 `workspaceId`，可选带 `executionSessionId`。
4. Provider 错误必须区分 `transient/permanent/concurrency_conflict`，便于上层重试与回滚。

### 6.1 Shared 包放置策略（针对本节契约）

1. 默认放在 `memory-store-adapter/src/shared-types/`：
   - `MemoryStoreProvider` 及其 request/result 契约属于存储适配域公共 API。
2. 默认不放到 `packages/shared-types`：
   - `MemoryProviderKind`、`MemoryArchiveReason` 等仍是存储域专属语义。
3. 若后续抽到 `packages/shared-types`：
   - `memory-store-adapter` 必须继续 re-export，保持单一契约入口，避免导入路径分裂。

## 7. Provider 扩展与能力矩阵基线

`MemoryProviderCapability` 最小字段：
1. `supportsQuery`
2. `supportsSnapshot`
3. `supportsArchive`
4. `supportsBatchWrite`
5. `supportsTransaction`

扩展要求：
1. Provider 必须声明能力矩阵，缺失能力时返回显式降级建议。
2. 装配层按 capability 做路由，不允许静默切换 provider。
3. 新增 provider 必须先通过 `memory-store-adapter` 契约测试后再接入 runtime。

## 8. 后端落地基线（与总方案对齐）

1. 基线后端：`memory-providers/fs-csv`
   - 负责本地文档/CSV 台账存储（含 `normative_knowledge_sources` 与执行状态源）。
2. 扩展后端：`memory-providers/sqlite`、`memory-providers/postgres`
   - 先落骨架与契约对齐，再逐步补齐性能/可靠性能力。
3. 切换原则：
   - 上层流程不感知后端细节，仅通过 provider 契约切换；切换后语义保持一致。

## 9. 抽离执行步骤（建议）

1. 建包：创建 `packages/memory-store-adapter` 最小结构与入口。
2. 契约落位：将存储请求/响应模型、能力声明与错误语义迁入 `shared-types`。
3. 装配桥接：新增 provider-registry/factory，先桥接现有文件存储路径。
4. 收口：`core-memory`、`core-session` 只保留对 adapter 契约调用，移除对具体存储实现直连。

## 10. 回归与验收口径

1. `build`：根级构建覆盖 `memory-store-adapter` 包编译。
2. `contract`：至少覆盖 `read/write/query/snapshot/archive` 五类契约测试。
3. `bridge`：`core-memory` 与 `core-session` 接入后不产生反向依赖。
4. `m1-exit`：`TK-116` 退出回归必须包含 provider 装配与契约一致性证据。

## 11. 后续任务输入映射

1. `TK-116`：纳入 M1 退出回归证据（store-adapter 契约 + 依赖方向）。
2. `TK-211`：作为 `normative_knowledge_sources` 存储接入的契约输入。
3. `TK-212`：作为 operational state source 存储接入的契约输入。

## 12. 验收标准

1. 存储适配域职责边界清晰，不与 memory/session/runtime 混淆。
2. 统一 Provider 契约可直接指导 `memory-providers/*` 实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
