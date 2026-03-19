# Workspace Schema 双模式基线（TK-201）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-001`
- Task: `TK-201`

## 1. 目标

定义 workspace 持久化双模式（`tool_managed/repo_local`）的统一 schema 与解析结果契约，作为 `TK-202~TK-206` 的实现输入，避免后续在路径解析、迁移与回滚语义上出现分歧。

## 2. 范围与非目标

1. 范围：
   - 固化 workspace 配置 schema（`governor.yaml -> workspace` 字段路径）与运行时解析输出模型。
   - 固化默认模式、解析优先级、路径命名和目录布局基线。
   - 固化迁移策略字段（`copy/verify/switch/rollback`）与失败回滚入口约束。
2. 非目标：
   - 本任务不实现具体 resolver 代码与 `repo_fingerprint` 算法落地（由 `TK-202` 负责）。
   - 本任务不实现 workspace 初始化流程（由 `TK-203` 负责）。
   - 本任务不实现 `repo_local` 兼容改造与迁移执行器（由 `TK-204~TK-206` 负责）。

## 3. Workspace Schema 契约（Draft）

说明：本文中的 `governor.yaml -> workspace` 表示配置文件中的字段路径，不是文件后缀命名。

### 3.1 配置层（`governor.yaml -> workspace`）

```ts
enum WorkspaceMode {
  ToolManaged = "tool_managed",
  RepoLocal = "repo_local",
}

enum WorkspaceResolutionSource {
  RuntimeFlags = "runtime_flags",
  GovernorYaml = "governor_yaml",
  DefaultFallback = "default_fallback",
}

enum WorkspaceMigrationStep {
  Copy = "copy",
  Verify = "verify",
  Switch = "switch",
  Rollback = "rollback",
}

interface WorkspaceMigrationPolicy {
  steps: WorkspaceMigrationStep[]; // 基线顺序: copy -> verify -> switch -> rollback(on_failure)
  verifyChecksum: boolean;
  verifyFileCount: boolean;
  allowAutoRollback: boolean;
}

interface WorkspaceConfig {
  mode?: WorkspaceMode; // 未配置时默认 tool_managed
  toolManagedRoot?: string; // 未配置时默认 ~/.repo-ai-governor/workspaces
  repoLocalRoot?: string; // 未配置时默认 .repo-ai-governor
  migrationPolicy?: WorkspaceMigrationPolicy;
}
```

### 3.2 解析结果层（Workspace Resolver 输出）

```ts
interface WorkspaceResolutionResult {
  workspaceId: string;
  workspaceMode: WorkspaceMode;
  workspaceRoot: string;
  repoFingerprint: string;
  resolutionSource: WorkspaceResolutionSource;
  resolvedAt: string; // RFC3339, 秒级精度，例如 2026-03-19T15:27:08+08:00
}
```

### 3.3 常量治理要求（CS-009）

1. `WorkspaceMode`、`WorkspaceResolutionSource`、`WorkspaceMigrationStep` 在实现时必须集中放置到 `src/constants/`。
2. 禁止在 resolver、migrator 中散落硬编码集合值；如需临时字面量，必须带 `// literal-set-allowed: reason` 注释。

## 4. 模式语义与解析优先级

1. 解析优先级固定：`runtime flags` > `governor.yaml -> workspace` > 默认 `tool_managed`。
2. 默认行为固定：未配置或配置缺失时必须回退 `tool_managed`，不得报错阻断首次启动。
3. `repo_local` 必须由用户显式选择，默认根目录为目标仓库的 `.repo-ai-governor/`。
4. `tool_managed` 根目录默认值：`~/.repo-ai-governor/workspaces/`，具体 workspace 目录由 `repo_fingerprint` 派生。

## 5. Workspace 根目录布局基线

目标仓库启用 `repo_local` 模式时：

```text
<repo_root>/.repo-ai-governor/
  governor.yaml
  context/current-context.md
  context/compiled-ir/
  context/artifact-registry/artifacts.csv
  normative_knowledge_sources/
  artifacts/
```

默认 `tool_managed` 模式时：

```text
~/.repo-ai-governor/workspaces/<repo_fingerprint>/
  governor.yaml
  context/current-context.md
  context/compiled-ir/
  context/artifact-registry/artifacts.csv
  normative_knowledge_sources/
  artifacts/
```

约束：
1. 两种模式目录语义必须一致，仅根路径不同，保证迁移与回放行为等价。
2. `normative_knowledge_sources/` 为规范资产统一入口；`context/current-context.md` 为执行状态事实源入口。

## 6. `repo_fingerprint` 与 `workspace_id` 规则（供 TK-202 落地）

1. 输入建议：`repo_root_abs_path + remote_origin(optional)`。
2. 输出建议：稳定摘要字符串（如 `sha256` 前 16~24 位），用于路径命名与冲突隔离。
3. `workspace_id` 建议形态：`ws_<repo_fingerprint>`，并保留跨环境可追踪性。
4. 同一仓库在同一模式下必须得到稳定 `workspace_id`，避免会话与记忆链路断裂。

## 7. 迁移与回滚契约（供 TK-205/TK-206 落地）

1. 迁移阶段固定为 `copy -> verify -> switch`，任一阶段失败触发 `rollback`。
2. `verify` 最少校验：
   - 文件数量一致；
   - 关键文件存在：`context/current-context.md`、`normative_knowledge_sources/`、`artifacts/`；
   - 可选校验：校验和一致。
3. `switch` 成功标准：
   - resolver 返回的新 `workspace_root` 可读写；
   - 写入一次最小心跳后可读回（幂等）。
4. `rollback` 要求：
   - 失败时自动恢复到切换前模式和根目录；
   - 必须记录 `rollback_reason` 与 `rollback_at`（RFC3339 秒级）。

## 8. 错误模型基线

建议错误码（实现阶段可扩展）：
1. `WORKSPACE_MODE_INVALID`
2. `WORKSPACE_ROOT_UNAVAILABLE`
3. `WORKSPACE_FINGERPRINT_CONFLICT`
4. `WORKSPACE_MIGRATION_VERIFY_FAILED`
5. `WORKSPACE_SWITCH_ROLLBACK_REQUIRED`

建议最小错误字段：
1. `error_code`
2. `error_message`
3. `workspace_mode`
4. `workspace_root`
5. `execution_session_id`（如有）
6. `occurred_at`（RFC3339 秒级）

## 9. 后续任务输入映射

1. `TK-202`：消费本基线实现 resolver 与 `repo_fingerprint`。
2. `TK-203`：消费本基线实现默认 `tool_managed` 初始化行为。
3. `TK-204`：消费本基线接入 `repo_local` 模式兼容。
4. `TK-205`：消费本基线实现 `copy/verify/switch` 迁移链路。
5. `TK-206`：消费本基线实现失败回滚与错误模型收口。
6. `TK-216`：将本基线纳入 M2 退出测试证据包。

## 10. 验收标准

1. 双模式语义、解析优先级、目录结构与迁移规则已固定且无冲突。
2. schema 契约可直接指导 `TK-202~TK-206` 实现，不依赖口头约定。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
