# Operational State Source 接入基线（TK-212）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-002`
- Task: `TK-212`

## 1. 目标

定义 `operational state source` 的接入契约与存储边界，确保“执行记忆（滑动窗口记忆）”在 `tool_managed/repo_local` 两种 workspace 模式下可被统一发现、更新、查询、快照和归档。

## 2. 范围与非目标

1. 范围：
   - 固化执行态记忆资产分类与索引契约。
   - 固化执行态状态更新、归档与恢复的最小语义。
   - 固化与 `core-memory`、`core-session`、`memory-store-adapter` 的边界。
2. 非目标：
   - 本任务不实现共享 session 事件总线（由 `TK-213` 负责）。
   - 本任务不实现 session 快照回放策略（由 `TK-214` 负责）。
   - 本任务不替代任务台账模型，只定义执行态记忆与台账的映射关系。

## 3. 目录与索引基线

建议目录：

```text
<workspace_root>/context/
  current-context.md
  operational-state-index.csv
  execution/
    <execution_id>/
      state.json
      stages.csv
      decisions.csv
```

约束：
1. `operational-state-index.csv` 作为执行态资产索引入口，至少包含 `state_id/path/type/status/updated_at/updated_at_display`。
2. `current-context.md` 是执行态入口锚点，但不能作为唯一事实源；索引必须可反向定位完整状态资产。
3. 所有时间字段使用 RFC3339 秒级时间戳，同时提供人类可读时间展示字段。

## 4. 执行态资产契约（Draft）

```ts
enum OperationalStateType {
  CurrentContext = "current-context",
  TaskChecklist = "task-checklist",
  TaskLedger = "task-ledger",
  StageState = "stage-state",
  DecisionRecord = "decision-record",
}

enum OperationalStateStatus {
  Hot = "hot",
  Warm = "warm",
  Archived = "archived",
  Corrupted = "corrupted",
}

interface OperationalStateRecord {
  stateId: string;
  type: OperationalStateType;
  path: string;
  status: OperationalStateStatus;
  workspaceId: string;
  executionId?: string;
  executionSessionId?: string;
  updatedAt: string; // RFC3339 秒级
  updatedAtDisplay: string; // YYYY-MM-DD HH:mm:ss UTC±HH:MM
  sourceTaskId?: string;
  checksum?: string;
}
```

CS-009 落地要求：
1. `OperationalStateType` 与 `OperationalStateStatus` 必须集中定义在 `src/constants/`。
2. 状态切换逻辑禁止使用散落字面量，统一通过常量集合驱动。

## 5. 状态更新与归档语义

1. `hot`：当前活跃执行态，允许高频更新。
2. `warm`：阶段完成后的稳定快照，可读优先。
3. `archived`：会话结束后的归档态，仅允许审计读取。
4. `corrupted`：校验失败或结构不完整，必须触发告警与恢复流程。

最小更新流程：
1. `load`：按 `execution_id/execution_session_id` 拉取当前态。
2. `apply_delta`：写入增量并附带 `sourceTaskId`。
3. `validate`：校验 schema、checksum、状态转换合法性。
4. `persist`：通过 `memory-store-adapter` 写入并更新索引。

## 6. 与存储适配层边界

1. 上层仅依赖统一契约：`read/write/query/snapshot/archive`。
2. 默认后端：本地文件 + CSV（`tool_managed/repo_local` 一致语义）。
3. 扩展后端：SQLite/PostgreSQL 等数据库，不改变状态分类与查询语义。

## 7. 与规范知识源协同规则

1. `normative_knowledge_sources` 提供稳定规则输入；`operational state source` 提供过程状态输出。
2. 执行态决策记录必须回链触发的规范资产（`normative_asset_id`）。
3. 当规范资产版本变化时，执行态索引必须追加版本映射字段，保证回放可解释。

## 8. 后续任务输入映射

1. `TK-213`：消费执行态资产与事件记录字段，建立共享 session 事件总线。
2. `TK-215`：复用 `updated_at/updated_at_display/sourceTaskId` 字段补齐审计模型。
3. `TK-216`：作为 M2 退出测试中执行态一致性验证输入。
4. `TK-217`：复用状态索引字段与版本语义，接入 Artifact Registry 解析契约。

## 9. 验收标准

1. 执行态记忆资产分类、索引字段与状态语义已固定。
2. 目录结构与存储边界满足 `tool_managed/repo_local` 双模式一致性。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
