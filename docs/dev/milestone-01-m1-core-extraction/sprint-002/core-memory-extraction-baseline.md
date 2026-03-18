# Core-Memory 抽离基线（TK-111）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-002`
- Task: `TK-111`

## 1. 目标

定义 `core-memory` 的抽离边界、最小记忆契约与迁移路径，确保“规范知识源 + 执行状态源”的上下文读写能力从 CLI/命令实现层解耦，后续可被 `core-session` 与 runtime 统一复用。

## 2. 范围与非目标

1. 范围：
   - `packages/core-memory` 的职责、目录结构与公共入口基线。
   - 记忆分层模型（normative/operational）与读写契约（read/write/query/snapshot）。
   - 与 `core-session`、`memory-store-adapter`、`core-runtime` 的依赖边界与迁移步骤。
2. 非目标：
   - 本任务不实现具体存储后端（文件/CSV/SQLite/Postgres），由 `TK-113` 负责。
   - 本任务不实现 session 生命周期编排，属于 `TK-112`。
   - 本任务不替换全部旧路径调用点，只固定可渐进迁移的桥接策略。

## 3. 包职责边界

### 3.1 `core-memory` 负责

1. 统一管理“规范知识源 + 执行状态源”的读取、写入与上下文合成。
2. 提供 Memory Manager 抽象，屏蔽上层对存储细节的直接耦合。
3. 提供快照与增量读写语义，支持后续 session 回放与审计。
4. 输出标准记忆元数据（scope/source/version/updated_at）供 runtime 与审计消费。

### 3.2 `core-memory` 不负责

1. 具体存储驱动装配与 provider 生命周期（属于 `memory-store-adapter`）。
2. 会话 ID 生命周期、并发冲突决策与回放策略（属于 `core-session`）。
3. 策略判定、人工闸口、通知派发（属于 `core-policy` / `notification-dispatcher`）。

## 4. 依赖方向约束（M1 阶段）

1. `core-memory` 可依赖：
   - `shared-types`
   - `shared-utils`
   - `config`
   - `memory-store-adapter`（仅依赖存储契约，不依赖具体 provider）
2. `core-memory` 不可依赖：
   - `apps/cli`
   - `memory-providers/*`
   - `adapters/*`
   - `notification-providers/*`
3. 协作方向：
   - `core-session` 可依赖 `core-memory` 输出；
   - `core-memory` 不反向依赖 `core-session`。

## 5. 目录与入口基线

```text
packages/core-memory/
  src/
    constants/
      memory-scope.ts
      memory-write-mode.ts
    memory-model.ts
    memory-manager.ts
    memory-source-resolver.ts
    memory-snapshot.ts
    index.ts
  test/
    memory-manager.test.ts
    memory-source-resolver.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014`。
2. 有限集合值通过 `src/constants/` 集中管理，对齐 `CS-009`。
3. 外部调用仅通过 `index.ts` 暴露稳定入口，禁止跨包直连内部文件。

## 6. 最小记忆契约（M1 Draft）

```ts
enum MemoryScope {
  Normative = "normative",
  Operational = "operational",
}

enum MemoryWriteMode {
  Replace = "replace",
  MergePatch = "merge-patch",
  Append = "append",
}

interface MemoryReadRequest {
  workspaceId: string;
  executionSessionId?: string;
  scope: MemoryScope;
  keys?: string[];
}

interface MemoryWriteRequest {
  workspaceId: string;
  executionSessionId?: string;
  scope: MemoryScope;
  mode: MemoryWriteMode;
  payload: Record<string, unknown>;
  sourceTaskId?: string;
  changeReason?: string;
}

interface MemorySnapshot {
  workspaceId: string;
  executionSessionId?: string;
  snapshotAt: string;
  scopes: Record<MemoryScope, Record<string, unknown>>;
}
```

契约约束：
1. `MemoryScope`、`MemoryWriteMode` 在实现中必须集中于 `packages/core-memory/src/constants/`。
2. `scope=normative` 默认只读；如需写入必须显式声明 `changeReason` 并进入审计。
3. `scope=operational` 写入必须可追溯 `sourceTaskId`，便于故障回放和责任定位。
4. 时间字段统一使用 RFC3339 秒级时间戳。

### 6.1 Shared 包放置策略（针对本节契约）

1. 默认不放到 `shared-types`：
   - `MemoryScope`、`MemoryWriteMode`、`MemorySnapshot` 属于 memory 域语义，应由 `core-memory` 维护。
2. 可放到 `shared-types` 的前提：
   - 类型已成为跨域通用基础语义，且由多个非 memory 域共同消费。
3. 若后续抽到 `shared-types`：
   - `core-memory` 必须继续对外 re-export，保持调用方以 `core-memory` 为单一契约入口。

## 7. 抽离执行步骤（建议）

1. 建包：创建 `packages/core-memory` 最小目录与入口。
2. 迁移：将当前分散在命令与工作流执行链中的上下文拼装与读写逻辑迁入 `memory-manager.ts`。
3. 桥接：CLI/runtime 先通过兼容层调用 `core-memory`，保留旧路径做短期对照。
4. 收口：在 `TK-112` 与 `TK-113` 完成后，移除重复读写实现，统一走 `core-memory` 入口。

## 8. 回归与验收口径

1. `build`：
   - 根级构建可覆盖 `core-memory` 包编译。
2. `test`：
   - 至少覆盖 `normative/operational` 读写与快照输出两类单测。
3. `bridge`：
   - `TK-112` 和 `TK-113` 使用该契约时不引入反向依赖。
4. `m1-exit`：
   - `TK-116` 退出回归需包含 memory 抽离边界验证证据。

## 9. 后续任务输入映射

1. `TK-112`：消费该基线完成 `core-session` 抽离，并复用 memory snapshot/delta 接口。
2. `TK-113`：消费该基线完成 `memory-store-adapter` 契约落位。
3. `TK-116`：将该基线纳入 M1 退出回归证据包。
4. `TK-211`：作为 M2 `normative_knowledge_sources` 接入的输入基线。

## 10. 验收标准

1. 记忆域职责边界清晰，不与 session/adapter/runtime 实现混淆。
2. 最小记忆契约可直接指导 `core-memory` 与下游包实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
