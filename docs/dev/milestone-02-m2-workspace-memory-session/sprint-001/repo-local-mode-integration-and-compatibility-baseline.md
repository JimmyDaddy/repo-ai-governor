# Repo-Local 模式接入与兼容基线（TK-204）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-001`
- Task: `TK-204`

## 1. 目标

定义 `repo_local` 模式的接入与兼容契约，确保用户显式选择仓库内 `.repo-ai-governor/` 作为 workspace 时，工具可稳定解析、初始化、复用并与既有仓库资产兼容。

## 2. 范围与非目标

1. 范围：
   - 固化 `repo_local` 模式的路径解析、激活条件与回退语义。
   - 固化与既有 `.repo-ai-governor/` 资产的兼容探测与保守写入策略。
   - 固化最小目录结构、初始化行为与审计字段要求。
2. 非目标：
   - 本任务不实现 `copy/verify/switch` 迁移执行细节（由 `TK-205` 负责）。
   - 本任务不实现失败错误模型总收口（由 `TK-206` 负责）。
   - 本任务不覆盖外部数据库 provider 迁移逻辑。

## 3. 模式激活与解析规则

1. 激活条件：
   - 仅当 `runtime flags` 或 `governor.yaml -> workspace.mode` 显式设置 `repo_local` 才启用。
2. 默认目录：
   - `repo_local_root` 缺省值：`.repo-ai-governor`。
3. 派生规则：
   - `workspace_root = <repo_root_abs_path>/<repo_local_root>/`
   - `workspace_id = ws_<repo_fingerprint>`（与 `tool_managed` 保持同一 ID 策略）
4. 显式模式失败语义：
   - 当用户显式选择 `repo_local` 且路径不可写/不可创建时，必须报错并提示修复。
   - 不允许静默降级到 `tool_managed`，避免用户感知与真实落盘位置不一致。

## 4. 目录结构与最小资产

`repo_local` 模式下的最小 workspace 结构：

```text
<repo_root>/.repo-ai-governor/
  governor.yaml
  context/
    current-context.md
    compiled-ir/
    artifact-registry/
      artifacts.csv
  normative_knowledge_sources/
  artifacts/
```

约束：
1. 目录语义需与 `tool_managed` 等价，保证模式切换前后行为一致。
2. `context/current-context.md`、`normative_knowledge_sources/`、`artifacts/` 必须可读写。
3. `governor.yaml` 已存在时不得覆盖未知用户字段，仅补齐缺失字段。

## 5. 兼容探测与保守写入策略

1. 探测阶段（`compat_probe`）：
   - 检查 `.repo-ai-governor/` 是否已存在；
   - 识别关键文件版本与结构完整性；
   - 记录兼容等级：`compatible` / `needs_reconcile` / `incompatible`。
2. 保守写入：
   - 对未知文件和未知目录保持只读，不做删除与覆盖。
   - 仅对工具定义的受管路径执行补齐与升级（如 `context/*`、`normative_knowledge_sources/*`）。
3. 补齐策略（`reconcile`）：
   - 缺失目录或文件按最小模板补齐；
   - 结构冲突进入人工确认或失败返回，不自动重命名用户资产。

## 6. 与既有仓库流程的兼容要求

1. 若仓库已存在 `.repo-ai-governor/context/current-context.md`，必须无缝复用，不重置正在执行的 stream 信息。
2. AGENTS 入口规则不变，仍由 `.repo-ai-governor/context/current-context.md` 作为可变执行上下文事实源。
3. 模式切换后，task/checklist/CSV/CR 路径解析应保持一致语义，只改变 `workspace_root` 物理落点。

## 7. 初始化与幂等要求（repo_local）

1. 首次初始化：
   - 目录不存在时创建最小结构；
   - 目录已存在时进入兼容探测与补齐。
2. 幂等性：
   - 重复初始化不得重复写入冲突内容；
   - 重复运行应返回相同 `workspace_id/workspace_root`。
3. 并发保护：
   - 建议沿用 `workspace_id` 锁语义（如 `.init.lock`），避免并发写入冲突。

## 8. 最小审计字段

1. `workspace_id`
2. `workspace_mode`（固定 `repo_local`）
3. `workspace_root`
4. `compat_probe_result`（compatible/needs_reconcile/incompatible）
5. `reconciled`（true/false）
6. `resolved_at`（RFC3339 秒级）
7. `resolved_by`（system/user/ci）

## 9. 建议错误码（repo_local 接入阶段）

1. `WORKSPACE_REPO_LOCAL_ROOT_UNWRITABLE`
2. `WORKSPACE_REPO_LOCAL_COMPAT_INCOMPATIBLE`
3. `WORKSPACE_REPO_LOCAL_RECONCILE_FAILED`
4. `WORKSPACE_REPO_LOCAL_EXPLICIT_MODE_NO_FALLBACK`
5. `WORKSPACE_REPO_LOCAL_CONTEXT_INTEGRITY_FAILED`

## 10. 后续任务输入映射

1. `TK-205`：消费本基线执行 `copy/verify/switch` 迁移链路编排。
2. `TK-206`：消费本基线收口 `repo_local` 失败语义与回滚策略。
3. `TK-216`：将本基线纳入 M2 退出测试与文档收口证据。

## 11. 验收标准

1. `repo_local` 激活、解析、兼容探测和保守写入规则已固定。
2. 目录语义与 `tool_managed` 保持一致，且显式模式失败不静默降级。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
