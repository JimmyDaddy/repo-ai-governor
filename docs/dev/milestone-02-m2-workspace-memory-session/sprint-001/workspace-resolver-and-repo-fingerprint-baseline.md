# Workspace Resolver 与 Repo Fingerprint 基线（TK-202）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-001`
- Task: `TK-202`

## 1. 目标

定义 `workspace resolver + repo_fingerprint` 的最小实现契约，确保 workspace 解析结果稳定、可审计、可迁移，并可直接驱动 `TK-203/204/205` 实施。

## 2. 范围与非目标

1. 范围：
   - 固化 resolver 输入输出模型、优先级解析顺序和路径归一化规则。
   - 固化 `repo_fingerprint` 计算材料、算法基线与冲突处理语义。
   - 固化 resolver 运行时最小校验与审计字段。
2. 非目标：
   - 本任务不实现 workspace 目录初始化（`TK-203`）。
   - 本任务不实现 `repo_local` 兼容迁移执行（`TK-204`、`TK-205`）。
   - 本任务不实现最终错误模型收口（`TK-206`）。

## 3. Resolver 职责边界

### 3.1 `workspace resolver` 负责

1. 按优先级解析 workspace mode/root。
2. 基于仓库信息生成稳定 `repo_fingerprint`。
3. 输出 `workspace_id/workspace_mode/workspace_root/resolution_source`。
4. 在返回结果前执行最小可用性检查（路径存在性、可写性、冲突检测）。

### 3.2 `workspace resolver` 不负责

1. 迁移阶段文件复制与切换（由迁移器负责）。
2. 记忆读取与会话装配（由 `core-memory/core-session` 负责）。
3. 策略判定和人工闸口（由 `core-policy` 负责）。

## 4. 输入输出契约（Draft）

```ts
enum WorkspaceResolutionSource {
  RuntimeFlags = "runtime_flags",
  GovernorYaml = "governor_yaml",
  DefaultFallback = "default_fallback",
}

interface WorkspaceResolveRequest {
  repoRootAbsPath: string;
  remoteOrigin?: string | null;
  runtimeModeOverride?: WorkspaceMode;
  runtimeRootOverride?: string;
  governorWorkspaceConfig?: WorkspaceConfig;
}

interface WorkspaceResolveResult {
  workspaceId: string;
  workspaceMode: WorkspaceMode;
  workspaceRoot: string;
  repoFingerprint: string;
  resolutionSource: WorkspaceResolutionSource;
  resolvedAt: string; // RFC3339, 秒级，例如 2026-03-19T16:08:21+08:00
}
```

约束：
1. `WorkspaceResolutionSource` 属于有限集合，必须放在 `src/constants/`（对齐 `CS-009`）。
2. `resolvedAt` 必须记录秒级时间戳，且输出为人类可读 RFC3339 格式。

## 5. 解析优先级与路径归一化

1. 模式优先级：`runtime flags` > `governor.yaml -> workspace.mode` > 默认 `tool_managed`。
2. 根路径优先级：
   - `tool_managed`: `runtimeRootOverride` > `governor.workspace.toolManagedRoot` > `~/.repo-ai-governor/workspaces`
   - `repo_local`: `runtimeRootOverride` > `governor.workspace.repoLocalRoot` > `.repo-ai-governor`
3. 路径归一化要求：
   - 先转绝对路径；
   - 处理 `~` 展开；
   - 清理重复分隔符与末尾分隔符；
   - 在 macOS/Linux 保持大小写，Windows 在计算 fingerprint 时统一小写盘符。

## 6. `repo_fingerprint` 计算基线

1. 计算材料（canonical material）：
   - `repo_root_abs_path`（归一化后）
   - `remote_origin_normalized`（可空）
   - `fingerprint_version=v1`
2. `remote_origin_normalized` 规则：
   - 去除认证信息与尾部 `.git`；
   - host 小写；
   - SSH/HTTPS 表示统一映射到同一 canonical 形式。
3. 输出算法建议：
   - `sha256(material)` -> hex -> 截取前 `24` 位作为 `repo_fingerprint`。
4. 冲突处理：
   - 若检测到同 fingerprint 对应不同 canonical material，抛出 `WORKSPACE_FINGERPRINT_CONFLICT`；
   - 不允许静默覆盖已有 workspace。

## 7. `workspace_id` 与根路径派生规则

1. `workspace_id`：`ws_<repo_fingerprint>`。
2. `workspace_root`：
   - `tool_managed`: `<tool_managed_root>/<repo_fingerprint>/`
   - `repo_local`: `<repo_root_abs_path>/<repo_local_root>/`
3. 解析结果应携带 `workspace_mode` 与 `resolution_source`，用于审计回放与问题定位。

## 8. 最小校验与错误语义

1. 校验项：
   - `repoRootAbsPath` 必须存在；
   - 解析后的 `workspace_root` 父目录必须可写；
   - `workspace_mode` 必须为受支持集合值；
   - 同一请求重复解析结果必须一致（幂等）。
2. 最小错误码：
   - `WORKSPACE_RESOLVE_INPUT_INVALID`
   - `WORKSPACE_ROOT_PERMISSION_DENIED`
   - `WORKSPACE_FINGERPRINT_CONFLICT`
   - `WORKSPACE_MODE_UNSUPPORTED`
3. 最小错误字段：
   - `error_code`, `error_message`, `workspace_mode`, `repo_root_abs_path`, `occurred_at`（RFC3339 秒级）。

## 9. 建议落盘元数据（供后续任务复用）

建议在 workspace 内维护 `context/workspace-resolution-meta.json`：

```json
{
  "workspace_id": "ws_8e17f0d6c1ab7f11313d6a21",
  "workspace_mode": "tool_managed",
  "workspace_root": "/Users/.../.repo-ai-governor/workspaces/8e17f0d6c1ab7f11313d6a21",
  "repo_fingerprint": "8e17f0d6c1ab7f11313d6a21",
  "resolution_source": "governor_yaml",
  "resolved_at": "2026-03-19T16:08:21+08:00"
}
```

## 10. 后续任务输入映射

1. `TK-203`：消费 resolver 输出实现 `tool_managed` 初始化。
2. `TK-204`：消费 resolver 输出接入 `repo_local` 解析兼容。
3. `TK-205`：消费 resolver 输出参与 `copy/verify/switch` 迁移链路。
4. `TK-216`：将本基线纳入 M2 退出测试输入集合。

## 11. 验收标准

1. resolver 输入输出契约、优先级和归一化规则已固定。
2. `repo_fingerprint` 计算材料与冲突语义明确，可直接指导实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
