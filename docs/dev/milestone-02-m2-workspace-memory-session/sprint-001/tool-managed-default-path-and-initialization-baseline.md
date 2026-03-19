# Tool-Managed 默认路径与初始化基线（TK-203）

- Status: active
- Date: 2026-03-19
- Milestone: `M2`
- Sprint: `sprint-001`
- Task: `TK-203`

## 1. 目标

固定默认 `tool_managed` 模式下的路径解析与初始化契约，确保用户未显式配置 workspace 时，工具可以稳定创建并复用仓库专属 workspace，且初始化行为可幂等、可审计、可回滚。

## 2. 范围与非目标

1. 范围：
   - 固化默认 `tool_managed` 根路径解析与目录派生规则。
   - 固化首次初始化必须创建的目录与种子文件清单。
   - 固化初始化幂等、并发保护、错误处理与最小审计字段。
2. 非目标：
   - 本任务不覆盖 `repo_local` 模式迁移链路（由 `TK-204/TK-205` 负责）。
   - 本任务不覆盖最终错误模型总收口（由 `TK-206` 负责）。
   - 本任务不实现 Memory Provider 具体存储驱动（由后续 memory-provider 任务负责）。

## 3. 默认模式与路径解析规则

1. 默认模式：
   - 当 `runtime flags` 与 `governor.yaml -> workspace.mode` 均未声明时，必须默认 `tool_managed`。
2. 默认根路径：
   - `tool_managed_root` 缺省值为 `~/.repo-ai-governor/workspaces`。
3. 工作区派生：
   - `workspace_root = <tool_managed_root>/<repo_fingerprint>/`
   - `workspace_id = ws_<repo_fingerprint>`
4. 约束：
   - 同一仓库重复解析必须返回稳定 `workspace_id/workspace_root`。
   - 不允许将默认路径写入目标仓库目录，除非用户显式切换 `repo_local`。

## 4. 初始化流程（tool_managed）

### 4.1 触发条件

1. `workspace_root` 不存在。
2. `workspace_root` 存在但缺失关键种子资产（见 4.3）。
3. `workspace_root` 元数据版本落后且可自动补齐。

### 4.2 执行步骤

1. `resolve`：
   - 调用 resolver 得到 `workspace_mode=tool_managed`、`workspace_root`、`workspace_id`。
2. `prepare`：
   - 创建目录并检查可写性。
3. `seed`：
   - 初始化最小目录结构与种子文件。
4. `verify`：
   - 校验关键文件存在、可读写、元数据一致。
5. `commit`：
   - 回写初始化审计事件与初始化元信息。

### 4.3 最小目录与种子文件

```text
~/.repo-ai-governor/workspaces/<repo_fingerprint>/
  governor.yaml
  context/
    current-context.md
    compiled-ir/
    artifact-registry/
      artifacts.csv
  normative_knowledge_sources/
  artifacts/
```

初始化要求：
1. `context/current-context.md` 必须存在并写入最小上下文模板。
2. `normative_knowledge_sources/` 必须存在，用于纳管规范资产入口。
3. `context/artifact-registry/artifacts.csv` 必须存在，可先写表头。
4. `governor.yaml` 缺失时可生成最小可运行配置；已存在时不得覆盖用户字段。

## 5. 幂等与并发初始化约束

1. 幂等要求：
   - 多次执行初始化，不应重复创建冲突资产，也不应重置已有用户数据。
2. 并发保护：
   - 同一 `workspace_id` 初始化建议采用文件锁或原子目录锁（如 `.init.lock`）。
   - 已存在进行中的初始化锁时，后续请求进入等待或快速失败并返回可重试信号。
3. 初始化状态：
   - `initializing` -> `ready` -> `degraded`（异常时）。
   - 状态变化必须写入审计事件流。

## 6. 校验与失败恢复

1. 成功判定（最小）：
   - 关键目录和种子文件完整；
   - `workspace-resolution-meta` 与 resolver 输出一致；
   - 心跳写入并读回成功。
2. 失败恢复：
   - 初始化中断时保留中间产物并标记 `degraded`，禁止误报 `ready`。
   - 支持下次初始化时执行 `reconcile`（补齐缺失资产，不覆盖已存在有效资产）。

## 7. 最小审计字段

1. `workspace_id`
2. `workspace_mode`（固定 `tool_managed`）
3. `workspace_root`
4. `repo_fingerprint`
5. `init_state`（initializing/ready/degraded）
6. `initialized_at`（RFC3339 秒级）
7. `initialized_by`（system/user/ci）
8. `init_error_code`（失败时）

## 8. 建议错误码（初始化阶段）

1. `WORKSPACE_INIT_ROOT_UNWRITABLE`
2. `WORKSPACE_INIT_SEED_FAILED`
3. `WORKSPACE_INIT_VERIFY_FAILED`
4. `WORKSPACE_INIT_LOCK_CONFLICT`
5. `WORKSPACE_INIT_METADATA_MISMATCH`

## 9. 后续任务输入映射

1. `TK-204`：复用初始化结构约束，保证 `repo_local` 接入后目录语义一致。
2. `TK-205`：复用初始化状态与验证口径，对接 `copy/verify/switch`。
3. `TK-206`：复用初始化错误码与状态语义，收口失败模型。
4. `TK-216`：将本基线纳入 M2 退出测试输入集合。

## 10. 验收标准

1. 默认 `tool_managed` 路径与初始化流程已固定且可执行。
2. 初始化目录结构、幂等语义、并发保护和失败恢复规则清晰。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
